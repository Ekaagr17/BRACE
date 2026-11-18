"""
Virtual network builder for BRACE attack simulations.

Creates realistic network topologies using NetworkX with typed assets,
connections, vulnerability scores, and security controls. Supports
synthetic network generation with configurable parameters.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

import networkx as nx


class AssetType(str, Enum):
    """Types of network assets."""
    SERVER = "server"
    WORKSTATION = "workstation"
    DATABASE = "database"
    ROUTER = "router"
    FIREWALL = "firewall"
    IOT = "iot"


class ConnectionType(str, Enum):
    """Types of network connections."""
    ETHERNET = "ethernet"
    WIFI = "wifi"
    VPN = "vpn"
    FIBER = "fiber"
    BLUETOOTH = "bluetooth"


@dataclass
class NetworkAsset:
    """A single asset in the virtual network.

    Attributes:
        id: Unique string identifier (e.g., 'asset_01').
        name: Human-readable name.
        asset_type: Type of asset.
        criticality: Importance rating from 1 (low) to 10 (critical).
        vulnerability_score: CVSS-like score from 0.0 (secure) to 1.0 (fully vulnerable).
        exposure: External exposure level from 0.0 (internal) to 1.0 (internet-facing).
        compromised: Whether the asset is currently compromised.
        security_controls: List of security control IDs applied to this asset.
        current_risk: Current computed risk score.
    """
    id: str
    name: str
    asset_type: AssetType
    criticality: int = 5
    vulnerability_score: float = 0.5
    exposure: float = 0.3
    compromised: bool = False
    security_controls: list[str] = field(default_factory=list)
    current_risk: float = 0.0

    def __post_init__(self) -> None:
        self.criticality = max(1, min(10, self.criticality))
        self.vulnerability_score = max(0.0, min(1.0, self.vulnerability_score))
        self.exposure = max(0.0, min(1.0, self.exposure))

    def compute_risk(self) -> float:
        """Compute risk as R_j = I_j * P_j where I=criticality, P=vulnerability*exposure."""
        probability = self.vulnerability_score * self.exposure
        self.current_risk = self.criticality * probability
        return self.current_risk

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "asset_type": self.asset_type.value,
            "criticality": self.criticality,
            "vulnerability_score": self.vulnerability_score,
            "exposure": self.exposure,
            "compromised": self.compromised,
            "security_controls": list(self.security_controls),
            "current_risk": self.current_risk,
        }


@dataclass
class NetworkConnection:
    """A connection between two network assets.

    Attributes:
        source_id: ID of the source asset.
        target_id: ID of the target asset.
        connection_type: Type of connection.
        bandwidth: Bandwidth in Mbps.
    """
    source_id: str
    target_id: str
    connection_type: ConnectionType = ConnectionType.ETHERNET
    bandwidth: float = 1000.0

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "source_id": self.source_id,
            "target_id": self.target_id,
            "connection_type": self.connection_type.value,
            "bandwidth": self.bandwidth,
        }


class VirtualNetwork:
    """Virtual network wrapping a NetworkX graph.

    Provides high-level methods for building and querying network topologies
    with typed assets and connections.
    """

    def __init__(self, name: str = "default_network") -> None:
        self.name = name
        self.graph = nx.Graph()
        self._assets: dict[str, NetworkAsset] = {}
        self._connections: list[NetworkConnection] = []

    @property
    def assets(self) -> dict[str, NetworkAsset]:
        """Access assets dictionary directly."""
        return self._assets

    @property
    def connections(self) -> list[NetworkConnection]:
        """Access connections list directly."""
        return self._connections

    def add_asset(self, asset: NetworkAsset) -> None:
        """Add an asset to the network.

        Args:
            asset: NetworkAsset to add.

        Raises:
            ValueError: If an asset with the same ID already exists.
        """
        if asset.id in self._assets:
            raise ValueError(f"Asset with id '{asset.id}' already exists")
        asset.compute_risk()
        self._assets[asset.id] = asset
        self.graph.add_node(asset.id, **asset.to_dict())

    def remove_asset(self, asset_id: str) -> None:
        """Remove an asset and all its connections.

        Args:
            asset_id: ID of the asset to remove.

        Raises:
            KeyError: If asset not found.
        """
        if asset_id not in self._assets:
            raise KeyError(f"Asset '{asset_id}' not found")
        del self._assets[asset_id]
        self.graph.remove_node(asset_id)
        self._connections = [
            c for c in self._connections
            if c.source_id != asset_id and c.target_id != asset_id
        ]

    def connect_assets(self, connection: NetworkConnection) -> None:
        """Create a connection between two assets.

        Args:
            connection: NetworkConnection specifying the link.

        Raises:
            KeyError: If either asset is not in the network.
        """
        if connection.source_id not in self._assets:
            raise KeyError(f"Source asset '{connection.source_id}' not found")
        if connection.target_id not in self._assets:
            raise KeyError(f"Target asset '{connection.target_id}' not found")

        self._connections.append(connection)
        self.graph.add_edge(
            connection.source_id,
            connection.target_id,
            connection_type=connection.connection_type.value,
            bandwidth=connection.bandwidth,
        )

    def get_asset(self, asset_id: str) -> NetworkAsset:
        """Get an asset by ID.

        Args:
            asset_id: ID of the asset.

        Returns:
            The NetworkAsset instance.

        Raises:
            KeyError: If asset not found.
        """
        if asset_id not in self._assets:
            raise KeyError(f"Asset '{asset_id}' not found")
        return self._assets[asset_id]

    def get_all_assets(self) -> list[NetworkAsset]:
        """Get all assets in the network."""
        return list(self._assets.values())

    def get_all_connections(self) -> list[NetworkConnection]:
        """Get all connections in the network."""
        return list(self._connections)

    def get_neighbors(self, asset_id: str) -> list[NetworkAsset]:
        """Get all assets directly connected to the given asset.

        Args:
            asset_id: ID of the asset.

        Returns:
            List of neighboring NetworkAsset instances.

        Raises:
            KeyError: If asset not found.
        """
        if asset_id not in self._assets:
            raise KeyError(f"Asset '{asset_id}' not found")
        neighbor_ids = list(self.graph.neighbors(asset_id))
        return [self._assets[nid] for nid in neighbor_ids]

    def get_topology_stats(self) -> dict[str, Any]:
        """Get statistics about the network topology.

        Returns:
            Dictionary with topology metrics.
        """
        n = self.graph.number_of_nodes()
        m = self.graph.number_of_edges()

        stats: dict[str, Any] = {
            "num_assets": n,
            "num_connections": m,
            "density": nx.density(self.graph) if n > 1 else 0.0,
            "is_connected": nx.is_connected(self.graph) if n > 0 else True,
            "num_components": nx.number_connected_components(self.graph) if n > 0 else 0,
            "asset_type_counts": {},
            "avg_degree": (2 * m / n) if n > 0 else 0.0,
            "max_degree": max(dict(self.graph.degree()).values()) if n > 0 else 0,
            "total_risk": sum(a.current_risk for a in self._assets.values()),
            "avg_vulnerability": (
                sum(a.vulnerability_score for a in self._assets.values()) / n
                if n > 0 else 0.0
            ),
        }

        # Count by asset type
        type_counts: dict[str, int] = {}
        for asset in self._assets.values():
            t = asset.asset_type.value
            type_counts[t] = type_counts.get(t, 0) + 1
        stats["asset_type_counts"] = type_counts

        # Degree distribution
        if n > 0:
            degrees = [d for _, d in self.graph.degree()]
            stats["degree_distribution"] = {
                "min": min(degrees),
                "max": max(degrees),
                "avg": sum(degrees) / len(degrees),
            }
        else:
            stats["degree_distribution"] = {"min": 0, "max": 0, "avg": 0.0}

        return stats

    def to_dict(self) -> dict[str, Any]:
        """Serialize the entire network to a dictionary."""
        return {
            "name": self.name,
            "assets": [a.to_dict() for a in self._assets.values()],
            "connections": [c.to_dict() for c in self._connections],
            "stats": self.get_topology_stats(),
        }


def generate_synthetic_network(num_assets: int = 20, seed: int = 42) -> VirtualNetwork:
    """Generate a synthetic network with realistic topology.

    Creates a network with a mix of asset types arranged in a hierarchical
    topology: firewalls at the edge, routers connecting segments, servers
    and databases in the core, workstations and IoT devices at the periphery.

    Args:
        num_assets: Number of assets to create (minimum 5).
        seed: Random seed for reproducibility.

    Returns:
        VirtualNetwork with assets and connections.
    """
    rng = random.Random(seed)
    num_assets = max(5, num_assets)
    network = VirtualNetwork(name=f"synthetic_{num_assets}_{seed}")

    # Determine asset type distribution
    type_distribution = {
        AssetType.FIREWALL: max(1, num_assets // 10),
        AssetType.ROUTER: max(1, num_assets // 8),
        AssetType.SERVER: max(1, num_assets // 4),
        AssetType.DATABASE: max(1, num_assets // 6),
        AssetType.WORKSTATION: max(1, num_assets // 3),
        AssetType.IOT: 0,  # Fill remaining
    }

    assigned = sum(type_distribution.values())
    type_distribution[AssetType.IOT] = max(0, num_assets - assigned)

    # If we overshot, reduce workstations
    total = sum(type_distribution.values())
    if total > num_assets:
        excess = total - num_assets
        type_distribution[AssetType.WORKSTATION] = max(
            1, type_distribution[AssetType.WORKSTATION] - excess
        )

    # Build flat list of types
    asset_types: list[AssetType] = []
    for atype, count in type_distribution.items():
        asset_types.extend([atype] * count)
    asset_types = asset_types[:num_assets]

    # Extend if needed
    while len(asset_types) < num_assets:
        asset_types.append(AssetType.WORKSTATION)

    rng.shuffle(asset_types)

    # Type-specific parameters
    type_params: dict[AssetType, dict[str, Any]] = {
        AssetType.FIREWALL: {
            "criticality_range": (7, 10),
            "vuln_range": (0.05, 0.3),
            "exposure_range": (0.7, 1.0),
            "name_prefix": "FW",
        },
        AssetType.ROUTER: {
            "criticality_range": (6, 9),
            "vuln_range": (0.1, 0.4),
            "exposure_range": (0.3, 0.7),
            "name_prefix": "RTR",
        },
        AssetType.SERVER: {
            "criticality_range": (6, 10),
            "vuln_range": (0.1, 0.6),
            "exposure_range": (0.2, 0.6),
            "name_prefix": "SRV",
        },
        AssetType.DATABASE: {
            "criticality_range": (8, 10),
            "vuln_range": (0.1, 0.5),
            "exposure_range": (0.05, 0.3),
            "name_prefix": "DB",
        },
        AssetType.WORKSTATION: {
            "criticality_range": (2, 6),
            "vuln_range": (0.2, 0.8),
            "exposure_range": (0.3, 0.8),
            "name_prefix": "WS",
        },
        AssetType.IOT: {
            "criticality_range": (1, 5),
            "vuln_range": (0.4, 0.9),
            "exposure_range": (0.5, 0.9),
            "name_prefix": "IOT",
        },
    }

    # Create assets
    type_counters: dict[str, int] = {}
    assets: list[NetworkAsset] = []

    for i, atype in enumerate(asset_types):
        params = type_params[atype]
        prefix = params["name_prefix"]
        type_counters[prefix] = type_counters.get(prefix, 0) + 1

        asset = NetworkAsset(
            id=f"asset_{i:03d}",
            name=f"{prefix}-{type_counters[prefix]:02d}",
            asset_type=atype,
            criticality=rng.randint(*params["criticality_range"]),
            vulnerability_score=round(rng.uniform(*params["vuln_range"]), 3),
            exposure=round(rng.uniform(*params["exposure_range"]), 3),
        )
        network.add_asset(asset)
        assets.append(asset)

    # Create connections based on topology rules
    # 1. Ensure connectivity with a spanning tree (random tree)
    node_ids = [a.id for a in assets]
    connected = {node_ids[0]}
    unconnected = set(node_ids[1:])

    while unconnected:
        src = rng.choice(list(connected))
        dst = rng.choice(list(unconnected))
        conn_type = _pick_connection_type(
            network.get_asset(src).asset_type,
            network.get_asset(dst).asset_type,
            rng,
        )
        network.connect_assets(NetworkConnection(
            source_id=src,
            target_id=dst,
            connection_type=conn_type,
            bandwidth=_pick_bandwidth(conn_type, rng),
        ))
        connected.add(dst)
        unconnected.discard(dst)

    # 2. Add extra edges for realism (small-world-like)
    extra_edges = int(num_assets * rng.uniform(0.3, 0.6))
    for _ in range(extra_edges):
        src = rng.choice(node_ids)
        dst = rng.choice(node_ids)
        if src != dst and not network.graph.has_edge(src, dst):
            conn_type = _pick_connection_type(
                network.get_asset(src).asset_type,
                network.get_asset(dst).asset_type,
                rng,
            )
            network.connect_assets(NetworkConnection(
                source_id=src,
                target_id=dst,
                connection_type=conn_type,
                bandwidth=_pick_bandwidth(conn_type, rng),
            ))

    return network


def _pick_connection_type(src_type: AssetType, dst_type: AssetType, rng: random.Random) -> ConnectionType:
    """Pick an appropriate connection type based on asset types."""
    if src_type == AssetType.IOT or dst_type == AssetType.IOT:
        return rng.choice([ConnectionType.WIFI, ConnectionType.BLUETOOTH])
    if src_type == AssetType.FIREWALL or dst_type == AssetType.FIREWALL:
        return ConnectionType.FIBER
    if src_type == AssetType.ROUTER or dst_type == AssetType.ROUTER:
        return rng.choice([ConnectionType.FIBER, ConnectionType.ETHERNET])
    if src_type == AssetType.WORKSTATION or dst_type == AssetType.WORKSTATION:
        return rng.choice([ConnectionType.ETHERNET, ConnectionType.WIFI])
    return ConnectionType.ETHERNET


def _pick_bandwidth(conn_type: ConnectionType, rng: random.Random) -> float:
    """Pick a realistic bandwidth for the connection type."""
    bandwidth_ranges: dict[ConnectionType, tuple[float, float]] = {
        ConnectionType.FIBER: (1000.0, 10000.0),
        ConnectionType.ETHERNET: (100.0, 1000.0),
        ConnectionType.WIFI: (50.0, 600.0),
        ConnectionType.VPN: (10.0, 200.0),
        ConnectionType.BLUETOOTH: (1.0, 3.0),
    }
    low, high = bandwidth_ranges.get(conn_type, (100.0, 1000.0))
    return round(rng.uniform(low, high), 1)
