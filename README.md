# ⚡ Energy Ingestion Engine

A high-scale, robust ingestion and analytical layer for an EV Fleet management platform, designed to handle 10,000+ Smart Meters and EV Fleets with millions of daily records.

## 🚀 Key Features

- **High-Performance Ingestion:** Optimized for high-frequency telemetry (60s intervals) from thousands of devices.
- **Dual-Store Architecture:** Separates "Hot" operational state from "Cold" historical audit trails.
- **Interactive Documentation:** Built-in Swagger UI for easy API testing and exploration.
- **Efficiency Analytics:** Calculates loss/efficiency ratios between Grid (AC) and Vehicle (DC) power delivery.

---

## 📖 API Documentation (Swagger)

The project includes interactive API documentation. When the server is running, you can access it here:

👉 **[http://localhost:3000/docs](http://localhost:3000/docs)**

From this UI, you can view all endpoints, see required data schemas, and execute live requests without using a terminal.

---

## 🛠️ Architecture

### 1. Data Ingestion Stream

The system recognizes two distinct types of telemetry arriving every 60 seconds:

- **Meter Stream:** Grid-side AC consumption data.
- **Vehicle Stream:** Vehicle-side DC delivery and SoC data.

### 2. Storage Strategy

To handle ~14.4 million records daily per stream, we use:

- **Operational Store (Hot):** Fast `UPSERT` operations for real-time status lookups (e.g., "What is the current SoC?").
- **Historical Store (Cold):** Append-only tables using composite indexing on `(id, timestamp)` for rapid time-range analytics.

---

## 💻 Getting Started

### Local Setup (Manual)

1. **Database**: Create a PostgreSQL database named `energy_ingestion`.
2. **Environment**: Update `.env` with your database credentials:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/energy_ingestion
   PORT=3000
   ```
3. **Run**:
   ```bash
   npm install
   npm run start:dev
   ```

### Docker Setup

```bash
docker-compose up --build
```

---

## 📊 Analytics Example

`GET /v1/analytics/performance/V1`

Returns a 24-hour summary combined with a real-time snapshot of the latest state:

```json
{
  "vehicleId": "V1",
  "meterId": "M1",
  "timeRange": "24h",
  "latestSnapshot": {
    "lastReadingAt": "2026-02-09T13:08:00Z",
    "currentSoC": 80.5,
    "currentVoltage": 230,
    "lastBatteryTemp": 34.2
  },
  "metrics": {
    "totalEnergyConsumedAc": 10.0,
    "totalEnergyDeliveredDc": 9.0,
    "efficiencyRatio": 0.9,
    "avgBatteryTemp": 32.5
  }
}
```

---

## 📈 Scalability Roadmap

- **Range Partitioning**: Telemetry tables should be partitioned by day.
- **Bulk Loading**: Implement row-batching for high-volume stream processing.
- **Cache Layer**: Use Redis for the `latest` status lookups to further reduce DB load.
