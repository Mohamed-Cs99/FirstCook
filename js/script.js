let employees = JSON.parse(localStorage.getItem('employees')) || [];
let attendanceRecords = JSON.parse(localStorage.getItem('attendance')) || [];
let financialRecords = JSON.parse(localStorage.getItem('financial')) || [];
let currentEmployeeId = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    // Set today's date in attendance date picker
    document.getElementById('attendanceDate').valueAsDate = new Date();

    // Set current month range in report and financial date pickers
    // Get today's date
    // Get today's date
    // Set current month range in report and financial date pickers
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1-2).toISOString().slice(0, 10);
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0-1).toISOString().slice(0, 10);
document.getElementById('reportFromDate').value = firstDay;
document.getElementById('reportToDate').value = lastDay;
document.getElementById('financialFromDate').value = firstDay;
document.getElementById('financialToDate').value = lastDay;   
    // Tab switching functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');

            // Load appropriate data when switching tabs
            if (this.dataset.tab === 'employees') {
                loadEmployees();
            } else if (this.dataset.tab === 'reports') {
                loadEmployeeOptions();
            } else if (this.dataset.tab === 'financial') {
                loadFinancialEmployeeOptions();
                loadFinancialRecords();
            }
        });
    });

    // Employee form submission
    document.getElementById('employeeForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const subscriptionSalary = parseFloat(document.getElementById('empSubscription').value) || 0;
        const inclusiveSalary = parseFloat(document.getElementById('empInclusive').value) || 0;
        const transfers = parseFloat(document.getElementById('empTransfers').value) || 0;
        const insuranceMoney = parseFloat(document.getElementById('insuranceMoney').value) || 0;
        const totalSalary = (subscriptionSalary + inclusiveSalary + transfers) - insuranceMoney;

        const employee = {
            id: currentEmployeeId || Date.now().toString(),
            name: document.getElementById('empName').value,
            department: document.getElementById('empDepartment').value,
            employeeId: document.getElementById('empId').value,
            subscriptionSalary,
            inclusiveSalary,
            transfers,
            insuranceMoney,
            totalSalary
        };

        if (currentEmployeeId) {
            const index = employees.findIndex(emp => emp.id === currentEmployeeId);
            if (index !== -1) {
                employees[index] = employee;
            }
            currentEmployeeId = null;
        } else {
            employees.push(employee);
        }

        localStorage.setItem('employees', JSON.stringify(employees));
        this.reset();
        document.getElementById('empTransfers').value = '0';
        document.getElementById('insuranceMoney').value = '0';
        loadEmployees();
    });

    // Financial form submission
    document.getElementById('financialForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const fromDate = document.getElementById('financialFromDate').value;
        const toDate = document.getElementById('financialToDate').value;
        const employeeId = document.getElementById('financialEmployee').value;

        if (!fromDate || !toDate || !employeeId) {
            alert('الرجاء اختيار الفترة والموظف');
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
            return;
        }

        const record = {
            id: Date.now().toString(),
            employeeId,
            fromDate,
            toDate,
            advance: parseFloat(document.getElementById('advance').value) || 0,
            deferredAdvance: parseFloat(document.getElementById('deferredAdvance').value) || 0,
            penalty: parseFloat(document.getElementById('penalty').value) || 0,
            bonus: parseFloat(document.getElementById('bonus').value) || 0,
            regularityAllowance: parseFloat(document.getElementById('regularityAllowance').value) || 0
        };

        const totalDeductions = record.advance + record.deferredAdvance + record.penalty;
        const totalAdditions = record.bonus + record.regularityAllowance;
        record.totalDeductions = totalDeductions;
        record.totalAdditions = totalAdditions;

        const existingIndex = financialRecords.findIndex(r =>
            r.employeeId === employeeId &&
            r.fromDate === fromDate &&
            r.toDate === toDate
        );
        if (existingIndex !== -1) {
            financialRecords[existingIndex] = record;
        } else {
            financialRecords.push(record);
        }

        localStorage.setItem('financial', JSON.stringify(financialRecords));
        this.reset();
        loadFinancialRecords();
        alert('تم حفظ المعاملات المالية بنجاح');
    });

    // Real-time employee search
    document.getElementById('employeeSearch').addEventListener('input', function () {
        searchEmployees(this.value);
    });

    // Clear employee search
    document.getElementById('searchEmployeeBtn').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('employeeSearch').value = '';
        searchEmployees('');
    });

    // Real-time attendance search
    document.getElementById('dailyAttendanceSearch').addEventListener('input', function () {
        searchDailyAttendance(this.value);
    });

    // Clear attendance search
    document.getElementById('clearAttendanceSearch').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('dailyAttendanceSearch').value = '';
        searchDailyAttendance('');
    });

    // Load attendance for selected date
    document.getElementById('loadAttendanceBtn').addEventListener('click', function () {
        loadDailyAttendance();
    });

    // Save daily attendance
    document.getElementById('saveAttendanceBtn').addEventListener('click', function () {
        saveDailyAttendance();
    });

    // Generate report
    document.getElementById('generateReportBtn').addEventListener('click', function () {
        generateReport();
    });

    // Initial data load
    loadEmployees();
    loadDailyAttendance();
});

// Employee Management Functions
function searchEmployees(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    let filteredEmployees = employees;

    if (term) {
        filteredEmployees = employees.filter(emp =>
            emp.name.toLowerCase().includes(term) ||
            emp.employeeId.toLowerCase().includes(term) ||
            emp.department.toLowerCase().includes(term)
        );
    }

    displayEmployees(filteredEmployees);
}

function displayEmployees(employeesToDisplay) {
    const employeesBody = document.getElementById('employeesBody');
    employeesBody.innerHTML = '';

    if (employeesToDisplay.length === 0) {
        employeesBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد نتائج مطابقة</td></tr>';
        return;
    }

    employeesToDisplay.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.employeeId}</td>
            <td>${emp.name}</td>
            <td>${emp.department}</td>
            <td>${emp.subscriptionSalary}</td>
            <td>${emp.inclusiveSalary}</td>
            <td>${emp.transfers}</td>
            <td>${emp.insuranceMoney}</td>
            <td>${emp.totalSalary}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${emp.id}">تعديل</button>
                <button class="action-btn delete-btn" data-id="${emp.id}">حذف</button>
            </td>
        `;
        employeesBody.appendChild(row);
    });

    addEmployeeActionListeners();
}

function loadEmployees() {
    displayEmployees(employees);
}

function addEmployeeActionListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            const emp = employees.find(e => e.id === id);
            if (emp) {
                document.getElementById('empName').value = emp.name;
                document.getElementById('empDepartment').value = emp.department;
                document.getElementById('empId').value = emp.employeeId;
                document.getElementById('empSubscription').value = emp.subscriptionSalary;
                document.getElementById('empInclusive').value = emp.inclusiveSalary;
                document.getElementById('empTransfers').value = emp.transfers;
                document.getElementById('insuranceMoney').value = emp.insuranceMoney;
                currentEmployeeId = id;
                document.getElementById('employeeForm').scrollIntoView();
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (confirm('هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف جميع سجلات الحضور والمعاملات المالية الخاصة به أيضًا.')) {
                const id = this.dataset.id;
                employees = employees.filter(emp => emp.id !== id);
                attendanceRecords = attendanceRecords.filter(record => record.employeeId !== id);
                financialRecords = financialRecords.filter(record => record.employeeId !== id);
                localStorage.setItem('employees', JSON.stringify(employees));
                localStorage.setItem('attendance', JSON.stringify(attendanceRecords));
                localStorage.setItem('financial', JSON.stringify(financialRecords));
                const currentSearch = document.getElementById('employeeSearch').value;
                searchEmployees(currentSearch);
                if (document.getElementById('daily').classList.contains('active')) {
                    loadDailyAttendance();
                }
                if (document.getElementById('financial').classList.contains('active')) {
                    loadFinancialRecords();
                }
            }
        });
    });
}

// Attendance Management Functions
function searchDailyAttendance(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const rows = document.querySelectorAll('#dailyAttendanceBody tr');

    rows.forEach(row => {
        const employeeId = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
        const employeeName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const department = row.querySelector('td:nth-child(3)').textContent.toLowerCase();

        if (term === '' ||
            employeeId.includes(term) ||
            employeeName.includes(term) ||
            department.includes(term)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function loadDailyAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const dailyAttendanceBody = document.getElementById('dailyAttendanceBody');
    dailyAttendanceBody.innerHTML = '';

    if (!date) {
        alert('الرجاء اختيار تاريخ');
        return;
    }

    if (employees.length === 0) {
        dailyAttendanceBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">لا يوجد موظفين مسجلين</td></tr>';
        return;
    }

    employees.forEach(emp => {
        const record = attendanceRecords.find(r => r.employeeId === emp.id && r.date === date);
        const isPresent = record?.status === 'present' || !record;

        const row = document.createElement('tr');
        if (record) {
            row.classList.add(record.status);
        } else {
            row.classList.add('unsaved', 'present');
        }

        row.innerHTML = `
            <td>${emp.employeeId}</td>
            <td>${emp.name}</td>
            <td>${emp.department}</td>
            <td>
                <select class="attendance-status" data-employee="${emp.id}">
                    <option value="present" ${isPresent ? 'selected' : ''}>حاضر</option>
                    <option value="absent" ${record?.status === 'absent' ? 'selected' : ''}>غائب</option>
                </select>
            </td>
            <td>
                <input type="number" class="work-hours" data-employee="${emp.id}" 
                       value="${isPresent ? (record?.workHours || 8) : 0}" min="0" max="12">
            </td>
            <td>
                <input type="number" class="extra-hours" data-employee="${emp.id}" 
                       value="${record?.extraHours || 0}" min="0" max="16">
            </td>
            <td>
                <input type="number" class="delay-minutes" data-employee="${emp.id}" 
                       value="${record?.delay || 0}" min="0">
            </td>
            <td>
                <input type="text" class="notes" data-employee="${emp.id}" 
                       value="${record?.notes || ''}">
            </td>
            <td>
                <button class="action-btn save-btn" data-employee="${emp.id}">حفظ</button>
            </td>
        `;

        dailyAttendanceBody.appendChild(row);

        row.querySelectorAll('.attendance-status, .work-hours, .extra-hours, .delay-minutes, .notes').forEach(element => {
            element.addEventListener('change', function () {
                if (!row.classList.contains('unsaved')) {
                    row.classList.add('unsaved');
                }
            });
        });

        const attendanceStatus = row.querySelector(`.attendance-status[data-employee="${emp.id}"]`);
        const workHoursInput = row.querySelector(`.work-hours[data-employee="${emp.id}"]`);

        attendanceStatus.addEventListener('change', () => {
            workHoursInput.value = attendanceStatus.value === 'present' ? 8 : 0;
            if (!row.classList.contains('unsaved')) {
                row.classList.add('unsaved');
            }
        });

        row.querySelector('.save-btn').addEventListener('click', function () {
            const employeeId = this.dataset.employee;
            saveEmployeeAttendance(employeeId);
            updateRowStatus(row);
        });
    });
}

function saveEmployeeAttendance(employeeId) {
    const date = document.getElementById('attendanceDate').value;
    const status = document.querySelector(`.attendance-status[data-employee="${employeeId}"]`).value;
    const workHours = document.querySelector(`.work-hours[data-employee="${employeeId}"]`).value;
    const extraHours = document.querySelector(`.extra-hours[data-employee="${employeeId}"]`).value;
    const delay = document.querySelector(`.delay-minutes[data-employee="${employeeId}"]`).value;
    const notes = document.querySelector(`.notes[data-employee="${employeeId}"]`).value;

    const finalWorkHours = status === 'absent' ? 0 : parseInt(workHours);
    const finalExtraHours = status === 'absent' ? 0 : parseInt(extraHours);

    const existingIndex = attendanceRecords.findIndex(r => r.employeeId === employeeId && r.date === date);

    const record = {
        employeeId,
        date,
        status,
        workHours: finalWorkHours,
        extraHours: finalExtraHours,
        delay: parseInt(delay),
        notes,
        deduction: calculateDeduction(status, parseInt(delay))
    };

    if (existingIndex !== -1) {
        attendanceRecords[existingIndex] = record;
    } else {
        attendanceRecords.push(record);
    }

    localStorage.setItem('attendance', JSON.stringify(attendanceRecords));
}

function saveDailyAttendance() {
    const rows = document.querySelectorAll('#dailyAttendanceBody tr');
    let unsavedCount = 0;

    rows.forEach(row => {
        // Correcting the reference to 'classList'
        if (row.classList.contains('unsaved')) {
            const saveButton = row.querySelector('.save-btn');

            // Ensure the save button exists before accessing 'dataset'
            if (saveButton) {
                const employeeId = saveButton.dataset.employee;
                saveEmployeeAttendance(employeeId);
                updateRowStatus(row);
                unsavedCount++;
            } else {
                console.error('Save button is not found in row:', row);
            }
        }
    });

    // Display appropriate alert messages
    if (unsavedCount === 0) {
        alert('جميع السجلات محفوظة بالفعل');
    } else {
        alert('تم حفظ حضور جميع الموظفين بنجاح');
    }
}

function updateRowStatus(row) {
    row.classList.remove('unsaved', 'present', 'absent');
    const status = row.querySelector('.attendance-status').value;
    row.classList.add(status);
}

function calculateDeduction(status, delay) {
    if (status === 'absent') {
        return 1;
    }
    return 0;
}

// Financial Transactions Functions
function loadFinancialEmployeeOptions() {
    const select = document.getElementById('financialEmployee');
    select.innerHTML = '<option value="">اختر الموظف</option>';

    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${emp.employeeId})`;
        select.appendChild(option);
    });

    // Update financial records when date range or employee changes
    document.getElementById('financialFromDate').addEventListener('change', loadFinancialRecords);
    document.getElementById('financialToDate').addEventListener('change', loadFinancialRecords);
    document.getElementById('financialEmployee').addEventListener('change', loadFinancialRecords);
}

function loadFinancialRecords() {
    const fromDate = document.getElementById('financialFromDate').value;
    const toDate = document.getElementById('financialToDate').value;
    const employeeId = document.getElementById('financialEmployee').value;
    const financialBody = document.getElementById('financialBody');
    financialBody.innerHTML = '';

    let filteredRecords = financialRecords;
    if (fromDate && toDate) {
        filteredRecords = filteredRecords.filter(r =>
            r.fromDate === fromDate && r.toDate === toDate
        );
    }
    if (employeeId) {
        filteredRecords = filteredRecords.filter(r => r.employeeId === employeeId);
    }

    if (filteredRecords.length === 0) {
        financialBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">لا توجد معاملات مالية</td></tr>';
        return;
    }

    filteredRecords.forEach(record => {
        const emp = employees.find(e => e.id === record.employeeId);
        if (!emp) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.employeeId}</td>
            <td>${emp.name}</td>
            <td>${record.advance.toFixed(2)}</td>
            <td>${record.deferredAdvance.toFixed(2)}</td>
            <td>${record.penalty.toFixed(2)}</td>
            <td>${record.bonus.toFixed(2)}</td>
            <td>${record.regularityAllowance.toFixed(2)}</td>
            <td>${record.totalDeductions.toFixed(2)}</td>
            <td>${record.totalAdditions.toFixed(2)}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${record.id}">تعديل</button>
                <button class="action-btn delete-btn" data-id="${record.id}">حذف</button>
            </td>
        `;
        financialBody.appendChild(row);
    });

    addFinancialActionListeners();
}

function addFinancialActionListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            const record = financialRecords.find(r => r.id === id);
            if (record) {
                document.getElementById('financialFromDate').value = record.fromDate;
                document.getElementById('financialToDate').value = record.toDate;
                document.getElementById('financialEmployee').value = record.employeeId;
                document.getElementById('advance').value = record.advance;
                document.getElementById('deferredAdvance').value = record.deferredAdvance;
                document.getElementById('penalty').value = record.penalty;
                document.getElementById('bonus').value = record.bonus;
                document.getElementById('regularityAllowance').value = record.regularityAllowance;
                financialRecords = financialRecords.filter(r => r.id !== id);
                localStorage.setItem('financial', JSON.stringify(financialRecords));
                loadFinancialRecords();
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (confirm('هل أنت متأكد من حذف هذه المعاملة المالية؟')) {
                const id = this.dataset.id;
                financialRecords = financialRecords.filter(r => r.id !== id);
                localStorage.setItem('financial', JSON.stringify(financialRecords));
                loadFinancialRecords();
            }
        });
    });
}

// Report Generation Functions
function loadEmployeeOptions() {
    const select = document.getElementById('reportEmployee');
    select.innerHTML = '<option value="">جميع الموظفين</option>';

    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${emp.employeeId})`;
        select.appendChild(option);
    });
}

function generateReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const employeeId = document.getElementById('reportEmployee').value;

    // Validate input dates
    if (!fromDate || !toDate) {
        alert('الرجاء اختيار الفترة');
        return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
        alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        return; // Add "return" here to ensure execution stops
    }

    // Filter employees based on ID (if provided)
    let filteredEmployees = employees;
    if (employeeId) {
        filteredEmployees = employees.filter(e => e.id === employeeId);
    }

    // Check if there are any employees to generate reports for
    if (filteredEmployees.length === 0) {
        alert('لا يوجد موظفين لهذه المعايير');
        return;
    }

    // Clear the report body table before appending rows
    const reportBody = document.getElementById('reportBody');
    reportBody.innerHTML = '';

    // Generate report rows
    filteredEmployees.forEach(emp => {
        const report = generateSalaryReport(emp.id, fromDate, toDate);

        // Create a new row for the employee report
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.employeeId}</td>
            <td>${emp.name}</td>
            <td>${emp.department}</td>
            <td>${report.daysData.attendedDays}</td>
            <td>${report.daysData.extraDays.toFixed(2)}</td>
            <td>${report.daysData.totalWorkedDays.toFixed(2)}</td>
            <td>${report.initialSalary.toFixed(2)}</td>
            <td>${report.inclusiveSalary.toFixed(2)}</td>
            <td>${emp.transfers.toFixed(2)}</td>
            <td>${report.totalDeductions.toFixed(2)}</td>
            <td>${report.totalAdditions.toFixed(2)}</td>
            <td>${report.netSalary.toFixed(2)}</td>
            <td><button class="action-btn details-btn" data-employee="${emp.id}">عرض التفاصيل</button></td>
        `;
        reportBody.appendChild(row);
    });

    // Add listeners for the details buttons
    addDetailsButtonListeners(fromDate, toDate);
}

function addDetailsButtonListeners(fromDate, toDate) {
    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const empId = this.dataset.employee;
            showEmployeeDetails(empId, fromDate, toDate);
        });
    });
}

function showEmployeeDetails(employeeId, fromDate, toDate) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    const employeeRecords = attendanceRecords.filter(record =>
        record.employeeId === employeeId &&
        record.date >= fromDate &&
        record.date <= toDate
    ).sort((a, b) => a.date.localeCompare(b.date));

    const financialRecord = financialRecords.find(record =>
        record.employeeId === employeeId &&
        record.fromDate === fromDate &&
        record.toDate === toDate
    );

    const detailsBody = document.getElementById('detailsBody');
    detailsBody.innerHTML = '';

    employeeRecords.forEach(record => {
        const extraHours = record.extraHours || 0;
        const workHours = record.workHours || 0;
        const totalHours = workHours + (extraHours * 1.5);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.date}</td>
            <td>${getStatusText(record.status)}</td>
            <td>${workHours.toFixed(2)}</td>
            <td>${extraHours.toFixed(2)}</td>
            <td>${totalHours.toFixed(2)}</td>
            <td>${record.delay}</td>
            <td>${record.deduction.toFixed(2)} يوم</td>
            <td>${record.notes || '-'}</td>
        `;
        detailsBody.appendChild(row);
    });

    // Add financial details if available
    if (financialRecord) {
        const financialRow = document.createElement('tr');
        financialRow.innerHTML = `
            <td colspan="8">
                <strong>التفاصيل المالية:</strong><br>
                السلفة: ${financialRecord.advance.toFixed(2)}<br>
                سلفة مؤجلة: ${financialRecord.deferredAdvance.toFixed(2)}<br>
                جزاء: ${financialRecord.penalty.toFixed(2)}<br>
                مكافأة: ${financialRecord.bonus.toFixed(2)}<br>
                بدل انتظام: ${financialRecord.regularityAllowance.toFixed(2)}<br>
                إجمالي الخصومات: ${financialRecord.totalDeductions.toFixed(2)}<br>
                إجمالي الإضافات: ${financialRecord.totalAdditions.toFixed(2)}
            </td>
        `;
        detailsBody.appendChild(financialRow);
    }

    document.getElementById('reportDetails').style.display = 'block';
    document.getElementById('reportDetails').scrollIntoView();
}

function getStatusText(status) {
    const statusMap = {
        'present': 'حاضر',
        'absent': 'غائب'
    };
    return statusMap[status] || status;
}

function calculateDailySalary(employee) {
    const dailySubscription = employee.subscriptionSalary / 30;
    const dailyInclusive = employee.inclusiveSalary / 30;

    return {
        dailySubscription,
        dailyInclusive
    };
}

function calculateWorkedDays(employee, monthlyRecords) {
    let attendedDays = 0;
    let totalExtraHours = 0;

    monthlyRecords.forEach(record => {
        if (record.status === 'present') {
            attendedDays++;
            totalExtraHours += record.extraHours || 0;
        }
    });

    const extraDays = (totalExtraHours * 1.5) / 8;

    return {
        attendedDays,
        extraDays,
        totalWorkedDays: attendedDays + extraDays
    };
}

function calculateFinancialComponents(employeeId, fromDate, toDate) {
    const financialRecord = financialRecords.find(record =>
        record.employeeId === employeeId &&
        record.fromDate === fromDate &&
        record.toDate === toDate
    );

    return {
        totalDeductions: financialRecord ? financialRecord.totalDeductions : 0,
        totalAdditions: financialRecord ? financialRecord.totalAdditions : 0,
        financialDetails: financialRecord ? {
            advance: financialRecord.advance,
            deferredAdvance: financialRecord.deferredAdvance,
            penalty: financialRecord.penalty,
            bonus: financialRecord.bonus,
            regularityAllowance: financialRecord.regularityAllowance
        } : null
    };
}

function calculateSalaryComponents(employee, monthlyRecords, fromDate, toDate) {
    const dailyRates = calculateDailySalary(employee);
    const daysData = calculateWorkedDays(employee, monthlyRecords);
    const financialData = calculateFinancialComponents(employee.id, fromDate, toDate);

    const initialSalary = daysData.totalWorkedDays * dailyRates.dailySubscription;
    const inclusiveSalary = daysData.attendedDays * dailyRates.dailyInclusive;
    const baseSalary = initialSalary + inclusiveSalary + employee.transfers - employee.insuranceMoney;

    const netSalary = baseSalary - financialData.totalDeductions + financialData.totalAdditions;

    return {
        dailyRates,
        daysData,
        initialSalary,
        inclusiveSalary,
        totalDeductions: financialData.totalDeductions,
        totalAdditions: financialData.totalAdditions,
        netSalary,
        financialDetails: financialData.financialDetails
    };
}

function generateSalaryReport(employeeId, fromDate, toDate) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    const monthlyRecords = attendanceRecords.filter(record =>
        record.employeeId === employeeId &&
        record.date >= fromDate &&
        record.date <= toDate
    );

    const salaryData = calculateSalaryComponents(employee, monthlyRecords, fromDate, toDate);

    return {
        employeeId: employee.employeeId,
        employeeName: employee.name,
        department: employee.department,
        fromDate,
        toDate,
        ...salaryData,
        transfers: employee.transfers,
        insuranceMoney: employee.insuranceMoney,
        breakdown: {
            "أجر الاشتراك اليومي": salaryData.dailyRates.dailySubscription.toFixed(2),
            "أجر الشامل اليومي": salaryData.dailyRates.dailyInclusive.toFixed(2),
            "أيام الحضور الفعلي": salaryData.daysData.attendedDays,
            "أيام الإضافي": salaryData.daysData.extraDays.toFixed(2),
            "إجمالي أيام العمل": salaryData.daysData.totalWorkedDays.toFixed(2),
            "الراتب الأولي (اشتراك)": salaryData.initialSalary.toFixed(2),
            "الراتب الشامل": salaryData.inclusiveSalary.toFixed(2),
            "بدل الانتقالات": employee.transfers.toFixed(2),
            "التأمين": employee.insuranceMoney.toFixed(2),
            "إجمالي الخصومات": salaryData.totalDeductions.toFixed(2),
            "إجمالي الإضافات": salaryData.totalAdditions.toFixed(2),
            "صافي الراتب": salaryData.netSalary.toFixed(2),
            ...(salaryData.financialDetails ? {
                "السلفة": salaryData.financialDetails.advance.toFixed(2),
                "سلفة مؤجلة": salaryData.financialDetails.deferredAdvance.toFixed(2),
                "جزاء": salaryData.financialDetails.penalty.toFixed(2),
                "مكافأة": salaryData.financialDetails.bonus.toFixed(2),
                "بدل انتظام": salaryData.financialDetails.regularityAllowance.toFixed(2)
            } : {})
        }
    };
}