// Data structure
let employees = JSON.parse(localStorage.getItem('employees')) || [];
let attendanceRecords = JSON.parse(localStorage.getItem('attendance')) || [];
let currentEmployeeId = null;
let currentReportEmployee = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date in attendance date picker
    document.getElementById('attendanceDate').valueAsDate = new Date();
    
    // Set current month in report month picker
    document.getElementById('reportMonth').value = new Date().toISOString().slice(0, 7);
    
    // Tab switching functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
            
            // Load appropriate data when switching tabs
            if (this.dataset.tab === 'employees') {
                loadEmployees();
            } else if (this.dataset.tab === 'reports') {
                loadEmployeeOptions();
            }
        });
    });
    
    // Employee form submission
    document.getElementById('employeeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Calculate total salary
        // const basicSalary = parseFloat(document.getElementById('empSalary').value) || 0;
        const subscriptionSalary = parseFloat(document.getElementById('empSubscription').value) || 0;
        const inclusiveSalary = parseFloat(document.getElementById('empInclusive').value) || 0;
        const transfers = parseFloat(document.getElementById('empTransfers').value) || 0;
        
        const totalSalary =  subscriptionSalary + inclusiveSalary + transfers;
        
        const employee = {
            id: currentEmployeeId || Date.now().toString(),
            name: document.getElementById('empName').value,
            department: document.getElementById('empDepartment').value,
            employeeId: document.getElementById('empId').value,
            // basicSalary: basicSalary,
            subscriptionSalary: subscriptionSalary,
            inclusiveSalary: inclusiveSalary,
            transfers: transfers,
            totalSalary: totalSalary
        };
        
        if (currentEmployeeId) {
            // Update existing employee
            const index = employees.findIndex(emp => emp.id === currentEmployeeId);
            if (index !== -1) {
                employees[index] = employee;
            }
            currentEmployeeId = null;
        } else {
            // Add new employee
            employees.push(employee);
        }
        
        localStorage.setItem('employees', JSON.stringify(employees));
        this.reset();
        document.getElementById('empTransfers').value = '0'; // Reset transfers to 0
        loadEmployees();
    });
    
    // Real-time employee search
    document.getElementById('employeeSearch').addEventListener('input', function() {
        searchEmployees(this.value);
    });
    
    // Clear search button
    document.getElementById('searchEmployeeBtn').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('employeeSearch').value = '';
        searchEmployees('');
    });
    
    // Load attendance for selected date
    document.getElementById('loadAttendanceBtn').addEventListener('click', function() {
        loadDailyAttendance();
    });
    
    // Save daily attendance
    document.getElementById('saveAttendanceBtn').addEventListener('click', function() {
        saveDailyAttendance();
    });
    
    // Generate report
    document.getElementById('generateReportBtn').addEventListener('click', function() {
        generateReport();
    });
    
    // Initial data load
    loadEmployees();
    loadDailyAttendance();
});

// Search employees function
function searchEmployees(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    let filteredEmployees = employees;
    
    if (term) {
        filteredEmployees = employees.filter(emp => 
            emp.name.toLowerCase().includes(term) ||
            emp.employeeId.toLowerCase().includes(term) ||
            emp.department.toLowerCase().includes(term) ||
            emp.totalSalary.toString().includes(term)
        );
    }
    
    displayEmployees(filteredEmployees);
}

// Display employees in table
function displayEmployees(employeesToDisplay) {
    const employeesBody = document.getElementById('employeesBody');
    employeesBody.innerHTML = '';
    
    if (employeesToDisplay.length === 0) {
        employeesBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد نتائج مطابقة</td></tr>';
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
            <td>${emp.totalSalary}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${emp.id}">تعديل</button>
                <button class="action-btn delete-btn" data-id="${emp.id}">حذف</button>
            </td>
        `;
        employeesBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addEmployeeActionListeners();
}

// Load all employees
function loadEmployees() {
    displayEmployees(employees);
}

// Add event listeners to employee action buttons
function addEmployeeActionListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const emp = employees.find(e => e.id === id);
            if (emp) {
                document.getElementById('empName').value = emp.name;
                document.getElementById('empDepartment').value = emp.department;
                document.getElementById('empId').value = emp.employeeId;
                document.getElementById('empSubscription').value = emp.subscriptionSalary;
                document.getElementById('empInclusive').value = emp.inclusiveSalary;
                document.getElementById('empTransfers').value = emp.transfers;
                currentEmployeeId = id;
                
                // Scroll to form
                document.getElementById('employeeForm').scrollIntoView();
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف جميع سجلات الحضور الخاصة به أيضًا.')) {
                const id = this.dataset.id;
                
                // Delete employee
                employees = employees.filter(emp => emp.id !== id);
                
                // Delete all attendance records for this employee
                attendanceRecords = attendanceRecords.filter(record => record.employeeId !== id);
                
                // Update local storage
                localStorage.setItem('employees', JSON.stringify(employees));
                localStorage.setItem('attendance', JSON.stringify(attendanceRecords));
                
                // Reload employees list
                const currentSearch = document.getElementById('employeeSearch').value;
                searchEmployees(currentSearch);
                
                // If we're on the attendance tab, reload that too
                if (document.getElementById('daily').classList.contains('active')) {
                    loadDailyAttendance();
                }
            }
        });
    });
}

// Load daily attendance
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
        const record = attendanceRecords.find(r =>
            r.employeeId === emp.id && r.date === date
        );

        const isPresent = record?.status === 'present' || !record;

        const row = document.createElement('tr');
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
                       value="${record?.extraHours || 0}" min="0" max="16"> <!-- New field -->
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

        if (record) {
            row.classList.add(record.status);
        }

        dailyAttendanceBody.appendChild(row);

        // Add dynamic update for work hours
        const attendanceStatus = row.querySelector(`.attendance-status[data-employee="${emp.id}"]`);
        const workHoursInput = row.querySelector(`.work-hours[data-employee="${emp.id}"]`);

        attendanceStatus.addEventListener('change', () => {
            workHoursInput.value = attendanceStatus.value === 'present' ? 8 : 0;
        });
    });

    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const employeeId = this.dataset.employee;
            saveEmployeeAttendance(employeeId);
        });
    });
}
// Save attendance for a single employee
function saveEmployeeAttendance(employeeId) {
    const date = document.getElementById('attendanceDate').value;
    const status = document.querySelector(`.attendance-status[data-employee="${employeeId}"]`).value;
    const workHours = document.querySelector(`.work-hours[data-employee="${employeeId}"]`).value;
    const extraHours = document.querySelector(`.extra-hours[data-employee="${employeeId}"]`).value; // Extra hours
    const delay = document.querySelector(`.delay-minutes[data-employee="${employeeId}"]`).value;
    const notes = document.querySelector(`.notes[data-employee="${employeeId}"]`).value;

    // Set work hours and extra hours to 0 if absent
    const finalWorkHours = status === 'absent' ? 0 : parseInt(workHours);
    const finalExtraHours = status === 'absent' ? 0 : parseInt(extraHours);

    // Find existing record
    const existingIndex = attendanceRecords.findIndex(r =>
        r.employeeId === employeeId && r.date === date
    );

    const record = {
        employeeId,
        date,
        status,
        workHours: finalWorkHours,
        extraHours: finalExtraHours, // Save extra hours
        delay: parseInt(delay),
        notes,
        deduction: calculateDeduction(status, parseInt(delay))
    };

    if (existingIndex !== -1) {
        // Update existing record
        attendanceRecords[existingIndex] = record;
    } else {
        // Add new record
        attendanceRecords.push(record);
    }

    // Update local storage
    localStorage.setItem('attendance', JSON.stringify(attendanceRecords));

    // Update row styling
    const rows = document.querySelectorAll('#dailyAttendanceBody tr');
    rows.forEach(row => {
        row.classList.remove('present', 'absent');
        if (row.querySelector(`.attendance-status[data-employee="${employeeId}"]`)) {
            row.classList.add(status);
        }
    });

    alert('تم حفظ بيانات الحضور بنجاح');
}

// Save all attendance for the day
function saveDailyAttendance() {
    const employeeIds = employees.map(emp => emp.id);
    employeeIds.forEach(id => saveEmployeeAttendance(id));
}

// Calculate deduction based on status and delay
function calculateDeduction(status, delay) {
    if (status === 'absent') {
        return 1; // 1 day salary deduction
    }
    return 0;
}

// Load employee options for report
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
function addDetailsButtonListeners(month) {
    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const empId = this.dataset.employee;
            showEmployeeDetails(empId, month);
        });
    });
}
// Generate monthly report
function generateReport() {
    const month = document.getElementById('reportMonth').value;
    const employeeId = document.getElementById('reportEmployee').value;

    if (!month) {
        alert('الرجاء اختيار الشهر');
        return;
    }

    let filteredEmployees = employees;
    if (employeeId) {
        filteredEmployees = employees.filter(e => e.id === employeeId);
    }

    const reportBody = document.getElementById('reportBody');
    reportBody.innerHTML = '';

    filteredEmployees.forEach(emp => {
        const report = generateSalaryReport(emp.id, month);
        
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
            <td>${report.totalSalary.toFixed(2)}</td>
            <td><button class="action-btn details-btn" data-employee="${emp.id}">عرض التفاصيل</button></td>
        `;
        reportBody.appendChild(row);
    });

    // Add event listeners to details buttons
    addDetailsButtonListeners(month);
}

// Show detailed attendance for an employee
function showEmployeeDetails(employeeId, month) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-${new Date(year, monthNum, 0).getDate()}`;

    const employeeRecords = attendanceRecords.filter(record => 
        record.employeeId === employeeId && 
        record.date >= startDate && 
        record.date <= endDate
    ).sort((a, b) => a.date.localeCompare(b.date));

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

    document.getElementById('reportDetails').style.display = 'block';
    document.getElementById('reportDetails').scrollIntoView();
}
// Helper function to get status text
function getStatusText(status) {
    const statusMap = {
        'present': 'حاضر',
        'absent': 'غائب'
    };
    return statusMap[status] || status;
}

function calculateDailySalary(employee) {
    // Daily salary components
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

    // Calculate extra days from overtime (every 8 extra hours = 1 day)
    const extraDays = totalExtraHours / 8;
    
    return {
        attendedDays,
        extraDays,
        totalWorkedDays: attendedDays + extraDays
    };
}

function calculateSalaryComponents(employee, monthlyRecords) {
    // Get daily rates
    const dailyRates = calculateDailySalary(employee);
    
    // Calculate worked days
    const daysData = calculateWorkedDays(employee, monthlyRecords);
    
    // Calculate salary components
    const initialSalary = daysData.totalWorkedDays * dailyRates.dailySubscription;
    const inclusiveSalary = daysData.attendedDays * dailyRates.dailyInclusive;
    
    return {
        dailyRates,
        daysData,
        initialSalary,
        inclusiveSalary,
        totalSalary: initialSalary + inclusiveSalary + employee.transfers
    };
}

function generateSalaryReport(employeeId, month) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;
    
    // Filter records for this month
    const monthlyRecords = attendanceRecords.filter(record => 
        record.employeeId === employeeId && 
        record.date.startsWith(month)
    );
    
    // Calculate salary
    const salaryData = calculateSalaryComponents(employee, monthlyRecords);
    
    return {
        employeeId: employee.employeeId,
        employeeName: employee.name,
        department: employee.department,
        month,
        ...salaryData,
        transfers: employee.transfers,
        breakdown: {
            "أجر الاشتراك اليومي": salaryData.dailyRates.dailySubscription.toFixed(2),
            "أجر الشامل اليومي": salaryData.dailyRates.dailyInclusive.toFixed(2),
            "أيام الحضور الفعلي": salaryData.daysData.attendedDays,
            "أيام الإضافي": salaryData.daysData.extraDays.toFixed(2),
            "إجمالي أيام العمل": salaryData.daysData.totalWorkedDays.toFixed(2),
            "الراتب الأولي (اشتراك)": salaryData.initialSalary.toFixed(2),
            "الراتب الشامل": salaryData.inclusiveSalary.toFixed(2),
            "بدل الانتقالات": employee.transfers.toFixed(2),
            "إجمالي الراتب": salaryData.totalSalary.toFixed(2)
        }
    };
}

function showSalaryDetails(employeeId, month) {
    const report = generateSalaryReport(employeeId, month);
    const detailsBody = document.getElementById('detailsBody');
    detailsBody.innerHTML = '';

    // Add salary breakdown
    Object.entries(report.breakdown).forEach(([key, value]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="2"><strong>${key}</strong></td>
            <td>${value}</td>
        `;
        detailsBody.appendChild(row);
    });

    document.getElementById('reportDetails').style.display = 'block';
}