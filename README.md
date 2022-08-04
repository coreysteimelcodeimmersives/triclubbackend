# triclubbackend

Team Sports Registration Application

Feature List:
[Core]User registration, login
Program Director/Coach/Admin
[Core] Create a sports program
Open/Closed Status
[Core] Assign users to programs
[Core] Program scheduling
[Core] View master program list on schedule view
[Core] CRUD for programs and enrollments
[Stretch] View individual program data
Enrollments
[Stretch] View program history
[Stretch] Segment programs by type/age group/ability
Parent User/Client
[Core] Lookup listed sports programs
date
type
age range
[Core] Enroll self or multiple children into program
[Core] See current enrollments

Data Schema
User {
email
password
uuid
type: {Enum["Admin", "Coach", "Parent", "Child"]}
parentId: {uuid} (only for children)
enrollmentIdList: {uuid[]}
...profileInfo
}
Program {
uuid
type
name
description
startDate
endDate
}
Enrollment {
uuid
userId: {uuid}
programId: {uuid}
type: {Enum["Admin", "Coach", "Parent", "Child"]}
}
