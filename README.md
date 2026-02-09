# High-Scale Energy Ingestion Engine

This project implements a robust, high-scale ingestion and analytical layer for a Fleet management platform, handling 10,000+ Smart Meters and EV Fleets.

## Architecture

### 1. Data Ingestion & Polymorphism

The system recognizes two distinct types of telemetry arriving every 60 seconds:

- **Meter Stream:** Grid-side AC consumption data.
- **Vehicle Stream:** Vehicle-side DC delivery and SoC data.

The system uses a common ingestion logic that routes data to two distinct stores based on "temperature".

### 2. Dual-Store Strategy (Operational vs. Historical)

To handle 14.4 million records daily per stream, we separate our data strategy:

#### Operational Store (Hot) - `meters_latest`, `vehicles_latest`

- **Purpose:** Fast access for "Current Status".
- **Implementation:** **UPSERT (Atomic Update)**.
- **Benefit:** Dashboard queries for "What is my car's current SoC?" are $O(1)$ lookups by ID, avoiding scans of millions of history rows.

#### Historical Store (Cold) - `meter_telemetry`, `vehicle_telemetry`

- **Purpose:** Append-only audit trail for long-term reporting.
- **Implementation:** **INSERT (Append-only)**.
- **Indexing:** Composite indexes on `(vehicleId, timestamp)` and `(meterId, timestamp)`.
- **Scaling Thesis:** For billions of rows, these tables leverage **PostgreSQL Range Partitioning** (by day or month) to keep index sizes manageable and allow for efficient data retention (dropping old partitions).

### 3. Data Correlation & Efficiency Thesis

Energy efficiency is calculated as `Efficiency = DC Delivered / AC Consumed`.
Since telemetry sources are independent, we use a `vehicle_meter_mapping` table to correlate which EV is drawing from which Meter.

The analytical query for 24-hour performance summary:

- Avoids full table scans by using the composite index on `(id, timestamp)`.
- Efficiently retrieves the _boundary_ readings (first and last) within the 24h window to calculate total energy deltas.
- Accuracy: Calculating delta (`max - min`) is more accurate for cumulative energy counters than summing granular changes which may suffer from missing packets.

## Technical Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL
- **ORM:** TypeORM

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Run the Application

```bash
docker-compose up --build
```

### API Endpoints

#### 1. Ingest Meter Data

`POST /v1/ingestion/meter`

```json
{
  "meterId": "M-123",
  "kwhConsumedAc": 1050.5,
  "voltage": 230,
  "timestamp": "2024-02-09T10:00:00Z"
}
```

#### 2. Ingest Vehicle Data

`POST /v1/ingestion/vehicle`

```json
{
  "vehicleId": "V-999",
  "soc": 45,
  "kwhDeliveredDc": 850.2,
  "batteryTemp": 32.5,
  "timestamp": "2024-02-09T10:00:00Z"
}
```

#### 3. Create Mapping (Correlation)

`POST /v1/ingestion/mapping`

```json
{
  "vehicleId": "V-999",
  "meterId": "M-123"
}
```

#### 4. Analytics Summary

`GET /v1/analytics/performance/V-999`

- Returns a 24-hour summary of AC vs DC energy, efficiency ratio, and average battery temperature.

## Handling Scale (14.4M Records/Day)

To handle this volume, the following optimizations are recommended for production:

1. **Database Partitioning:** Use Postgres Range Partitioning on telemetry tables by `timestamp` (daily).
2. **Bulk Ingestion:** If streams arrive in batches, use TypeORM `insert()` with multiple values to reduce transaction overhead.
3. **Read Replicas:** Scale analytical queries by routing them to Postgres Read Replicas.
4. **Data Retention:** Implement a TTL policy by dropping old partitions to keep the "Cold" store within disk limits.
