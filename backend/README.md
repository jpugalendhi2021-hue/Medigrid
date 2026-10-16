# MediGrid — Java Spring Boot Backend

Production-ready, multi-hospital intelligent OPD allocation and digital health records backend service built in **Java (Spring Boot 3 + Spring Data JPA)**.

---

## 🏗️ Architecture & Features Implemented in Java

1. **Intelligent OPD Load-Balanced Allocation Engine (`DoctorAllocationService.java`)**:
   - Analyzes real-time slot capacity across department specialists.
   - Preserves **Chronic Care Doctor Continuity** for diagnosed recurring patients.
   - Automatically re-routes to vetted substitute specialists when the primary doctor is on sanctioned leave, transmitting longitudinal health history.
   - Calculates dynamic queue wait times (`estimatedWaitMinutes = queueLength * 12 min`).

2. **Dean Council Governance & Leave Escalation (`LeaveGovernanceService.java`)**:
   - Clinical governance rule: Hospital administrators possess unilateral approval authority for leaves **$\le$ 2 consecutive days**.
   - Any leave request spanning **$> 2$ consecutive days** is locked from local hospital approval and escalated exclusively to the regional **Dean Council**.

3. **Digital Health Records & Longitudinal Vitals (`CheckupService.java`)**:
   - Enforces structured recording of blood pressure (systolic/diastolic), fasting blood sugar, weight, and heart rate.
   - Detects newly diagnosed chronic conditions and automatically links them to the patient's longitudinal profile.

4. **Multi-Facility Relational Architecture (`model/`)**:
   - Entities: `Hospital`, `Department`, `Doctor`, `Patient`, `Appointment`, `CheckupRecord`, `LeaveRequest`, `LabReport`, `AuditLog`.
   - Seeded with 3 regional hospitals, multi-department doctors, and sample chronic care timelines upon startup (`DataInitializer.java`).

---

## 🚀 How to Run the Java Backend

### Prerequisites
- **Java 17** or **Java 21** installed (`java -version`)
- **Maven 3.8+** installed (`mvn -version`)

### Quick Start (In-Memory H2 DB)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Compile and run with Maven:
   ```bash
   mvn spring-boot:run
   ```

3. The server starts at `http://localhost:8080`.
4. Open the interactive **H2 Database Web Console**:
   - URL: `http://localhost:8080/h2-console`
   - JDBC URL: `jdbc:h2:mem:medigriddb`
   - User: `sa`
   - Password: `password`

---

## 📡 REST API Endpoint Summary

| HTTP Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hospitals` | List all regional hospitals in network |
| `GET` | `/api/hospitals/{id}/departments` | Get departments for a hospital |
| `POST` | `/api/hospitals/{id}/departments` | Add new clinical department to hospital |
| `GET` | `/api/departments` | List all clinical departments |
| `POST` | `/api/departments` | Create clinical department |
| `GET` | `/api/doctors` | List all credentialed doctors |
| `GET` | `/api/doctors/{id}/queue` | Get live OPD queue for a doctor |
| `POST` | `/api/appointments/preview-allocation` | Compute smart doctor match & wait times |
| `POST` | `/api/appointments/book` | Book appointment with token generation |
| `POST` | `/api/appointments/call-next/{doctorId}` | Usher next patient into consultation |
| `POST` | `/api/appointments/submit-checkup` | Log vitals, diagnosis, and prescriptions |
| `GET` | `/api/patients/{id}/records` | Fetch patient digital health records |
| `GET` | `/api/patients/by-phone/{phone}` | Look up patient by mobile number |
| `POST` | `/api/patients/upload-report-by-mobile` | Upload lab report dispatched to mobile number |
| `POST` | `/api/leaves` | File leave request (auto-escalates if >2 days) |
| `POST` | `/api/leaves/{id}/hospital-approve` | Hospital Admin approval (≤2 days or executive dispensation) |
| `POST` | `/api/leaves/{id}/hospital-reject` | Hospital Admin leave rejection |
| `POST` | `/api/leaves/{id}/dean-approve` | Dean Council dispensation approval |
| `POST` | `/api/leaves/{id}/dean-reject` | Dean Council rejection |
| `GET` | `/api/audits` | Query immutable governance audit ledger |
