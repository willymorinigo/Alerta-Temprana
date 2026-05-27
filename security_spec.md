# Security Specification - Alerta Temprana Brandsen

This document specifies the security posture and data invariants for our Firestore collections (`reports` and `admins`).

## 1. Data Invariants
- **Public Reading**: Any neighbor (including guest users) must be able to read existing incident reports so they can locate them on the interactive map.
- **Public Submissions**: Anyone (including guest users) must be able to create a report with a category, description, coordinates, and address, making citizen participation seamless.
- **Protected Actions (Admin Updates)**: Only validated municipal administrators (identified in the `/admins` collection or of bootstrapped email `willymorinigo@gmail.com`) can update report statuses, transition them between states, or add internal coordinator comments.
- **Immutability**: Once a report is created, its core geography (`lat`, `lng`), original timestamps (`createdAt`), and reporting neighbor's details must remain unalterable.
- **Admin Isolation**: The list of administrators in `/admins` can only be updated by other administrators.

## 2. The "Dirty Dozen" Attack Vectors
1. **Unregistered Status Manipulation**: A guest user tries to mark a report as "Cerrado" or "En Cuadrilla".
2. **Identity Spoofing**: An unauthorized user tries to modify the `neighborName` or `neighborPhone` of a report.
3. **Malicious Record Deletion**: An unauthorized user tries to delete a public report.
4. **Incorrect Status Types**: An attacker tries to write an unrecognized status like `"Explotado"`.
5. **Admin Records Takeover**: An anonymous user tries to write themselves into the `/admins` collection.
6. **Denial of Wallet (ID Injection)**: An attacker tries to create a report with an excessively long id of 50KB to increase storage costs.
7. **Malicious Long String Injection**: An attacker submits a description of 2MB size to blow up documents.
8. **Coordinates Spoofing in Update**: An attacker attempts to change the spatial position of an existing hazard.
9. **Creation Timestamp Spoofing**: An attacker tries to fake the `createdAt` timestamp to be in the past or future.
10. **Bypassing Category Constraints**: An attacker writes `"Bomba nuclear"` instead of one of the defined public service tags.
11. **Admin Promotion Spoofing**: An attacker logs in with an unverified email address or spoofed token and tries to register as Coordinator.
12. **Status Shortcutting**: Passing notes/comments into `internalComments` without going through the authorized admin status change function.

## 3. Test Cases Spec
All of the following must return `PERMISSION_DENIED`:
- Writing an admin document if not the bootstrapped developer.
- Updating status/comments parameter without being listed in the `admins` lookup.
- Altering coordinate floats (`lat` and `lng`) during update events.
- Trying to issue delete request on items within `reports` collection.
