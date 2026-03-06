// المتغيرات العامة
let donors = [];
let donations = [];
let vouchers = [];

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    initializeEventListeners();
    loadData();
});

// التحقق من حالة تسجيل الدخول
function checkLoginStatus() {
    if (!auth.isLoggedIn()) {
        showModal('loginModal');
    } else {
        updateLoginButton();
    }
}

// تحديث زر الدخول
function updateLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.textContent = 'خروج';
    loginBtn.onclick = logout;
}

// تهيئة مستمعي الأحداث
function initializeEventListeners() {
    // أزرار الإجراءات الرئيسية
    document.getElementById('addDonorBtn').addEventListener('click', () => {
        showModal('addDonorModal');
    });
    
    document.getElementById('addDonationBtn').addEventListener('click', () => {
        showModal('addDonationModal');
        loadDonorsForDonation();
    });
    
    document.getElementById('addVoucherBtn').addEventListener('click', () => {
        showModal('addVoucherModal');
        loadDonorsForVoucher();
    });
    
    document.getElementById('donorsListBtn').addEventListener('click', async () => {
        await loadDonorsList();
        showModal('donorsListModal');
    });
    
    document.getElementById('redeemVoucherBtn').addEventListener('click', async () => {
        await loadVouchersForRedemption();
        showModal('redeemVoucherModal');
    });
    
    document.getElementById('statisticsBtn').addEventListener('click', () => {
        showModal('statisticsModal');
    });
    
    // الدعوات - التأكد من وجود العناصر أولاً
    const createInvitationBtn = document.getElementById('createInvitationBtn');
    if (createInvitationBtn) {
        createInvitationBtn.addEventListener('click', () => {
            console.log('زر إنشاء الدعوة تم الضغط عليه');
            showModal('invitationModal');
        });
    } else {
        console.error('زر إنشاء الدعوة غير موجود');
    }
    
    const invitationForm = document.getElementById('invitationForm');
    if (invitationForm) {
        invitationForm.addEventListener('submit', handleCreateInvitation);
    }
    
    const shareInvitationBtn = document.getElementById('shareInvitationBtn');
    if (shareInvitationBtn) {
        shareInvitationBtn.addEventListener('click', shareInvitation);
    }
    
    const downloadInvitationBtn = document.getElementById('downloadInvitationBtn');
    if (downloadInvitationBtn) {
        downloadInvitationBtn.addEventListener('click', downloadInvitation);
    }
    
    const copyInvitationBtn = document.getElementById('copyInvitationBtn');
    if (copyInvitationBtn) {
        copyInvitationBtn.addEventListener('click', copyInvitationText);
    }
    
    // نماذج الإدخال
    document.getElementById('addDonorForm').addEventListener('submit', handleAddDonor);
    document.getElementById('addDonationForm').addEventListener('submit', handleAddDonation);
    document.getElementById('addVoucherForm').addEventListener('submit', handleAddVoucher);
    document.getElementById('redeemVoucherForm').addEventListener('submit', handleRedeemVoucher);
    document.getElementById('editDonorForm').addEventListener('submit', handleEditDonor);
    document.getElementById('editDonationForm').addEventListener('submit', handleEditDonation);
    document.getElementById('editVoucherForm').addEventListener('submit', handleEditVoucher);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // البحث والفلترة في قائمة المتبرعين
    document.getElementById('searchDonors').addEventListener('input', filterDonors);
    document.getElementById('bloodTypeFilter').addEventListener('change', filterDonors);
    document.getElementById('eligibilityFilter').addEventListener('change', filterDonors);
    document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
    
    // البحث عن المتبرعين في النماذج
    document.getElementById('donationDonorSearch').addEventListener('input', (e) => searchDonors(e.target.id, 'donation'));
    document.getElementById('voucherDonorSearch').addEventListener('input', (e) => searchDonors(e.target.id, 'voucher'));
    
    // الإحصائيات
    document.getElementById('generateStats').addEventListener('click', generateStatistics);
    document.getElementById('printStats').addEventListener('click', printStatistics);
    document.getElementById('clearStats').addEventListener('click', clearStatisticsFilters);
    
    // فلتر نوع الكشف بالأسماء
    document.getElementById('statsType').addEventListener('change', (e) => {
        const namesListType = document.getElementById('namesListType');
        const donorSearchSection = document.getElementById('donorSearchSection');
        
        if (e.target.value === 'namesList') {
            namesListType.style.display = 'block';
            donorSearchSection.style.display = 'none';
        } else if (e.target.value === 'donorStats') {
            namesListType.style.display = 'none';
            donorSearchSection.style.display = 'block';
        } else {
            namesListType.style.display = 'none';
            donorSearchSection.style.display = 'none';
        }
    });
    
    // البحث عن متبرع للإحصائيات
    document.getElementById('donorStatsSearch').addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const resultsContainer = document.getElementById('donorStatsResults');
        
        if (!searchTerm) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        try {
            const allDonors = await firebaseDB.getDonors();
            const filteredDonors = allDonors.filter(donor => 
                donor.name.toLowerCase().includes(searchTerm) ||
                donor.phone.includes(searchTerm)
            );
            
            if (filteredDonors.length === 0) {
                resultsContainer.innerHTML = '<div class="search-result-item">لا توجد نتائج</div>';
                resultsContainer.style.display = 'block';
                return;
            }
            
            const html = filteredDonors.map(donor => `
                <div class="search-result-item" onclick="selectDonorForStats('${donor.id}', '${donor.name}')">
                    <div class="donor-name">${donor.name}</div>
                    <div class="donor-info">${donor.phone} - ${donor.bloodType}</div>
                </div>
            `).join('');
            
            resultsContainer.innerHTML = html;
            resultsContainer.style.display = 'block';
        } catch (error) {
            console.error('Error searching donors:', error);
        }
    });
    
    // اختيار الشيك للصرف
    document.getElementById('voucherSelect').addEventListener('change', handleVoucherSelection);
    
    // إغلاق النوافذ عند النقر خارجها
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
}

// تحميل البيانات
async function loadData() {
    try {
        const [donorsData, donationsData, vouchersData, stats] = await Promise.all([
            firebaseDB.getRecentDonors(10),
            firebaseDB.getRecentDonations(10),
            firebaseDB.getRecentVouchers(10),
            firebaseDB.getStatistics()
        ]);
        
        donors = donorsData;
        donations = donationsData;
        vouchers = vouchersData;
        
        updateStatistics(stats);
        updateRecentDonors();
        updateRecentDonations();
        updateRecentVouchers();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
    }
}

// تحديث الإحصائيات
function updateStatistics(stats) {
    document.getElementById('donorsCount').textContent = stats.donorsCount;
    document.getElementById('donationsCount').textContent = stats.donationsCount;
    document.getElementById('vouchersCount').textContent = stats.vouchersCount;
}

// تحديث قائمة المتبرعين الأخيرين
function updateRecentDonors() {
    const container = document.getElementById('recentDonors');
    
    if (donors.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد متبرعين</p>';
        return;
    }
    
    const html = donors.slice(0, 5).map(donor => `
        <div class="list-item">
            <span class="item-name">${donor.name}</span>
            <span class="item-info">${donor.bloodType}</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// تحديث قائمة التبرعات الأخيرة
function updateRecentDonations() {
    const container = document.getElementById('recentDonations');
    
    if (donations.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد تبرعات</p>';
        return;
    }
    
    const html = donations.slice(0, 5).map(donation => {
        const date = donation.createdAt ? new Date(donation.createdAt.toDate()).toLocaleDateString('ar-SA') : 'غير محدد';
        return `
            <div class="list-item">
                <span class="item-name">${donation.donorName}</span>
                <span class="item-info">${date}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ملء قائمة المتبرعين
function populateDonorSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">اختر المتبرع</option>';
    
    donors.forEach(donor => {
        const option = document.createElement('option');
        option.value = donor.id;
        option.textContent = `${donor.name} (${donor.bloodType})`;
        select.appendChild(option);
    });
}

// معالجة إضافة متبرع جديد
async function handleAddDonor(e) {
    e.preventDefault();
    
    const donorData = {
        name: document.getElementById('donorName').value.trim(),
        phone: document.getElementById('donorPhone').value.trim(),
        bloodType: document.getElementById('donorBloodType').value,
        notes: document.getElementById('donorNotes').value.trim()
    };
    
    try {
        await firebaseDB.addDonor(donorData);
        showNotification('تم إضافة المتبرع بنجاح', 'success');
        closeModal('addDonorModal');
        document.getElementById('addDonorForm').reset();
        loadData(); // إعادة تحميل البيانات
    } catch (error) {
        console.error('Error adding donor:', error);
        showNotification('حدث خطأ في إضافة المتبرع', 'error');
    }
}

// معالجة إضافة تبرع جديد
async function handleAddDonation(e) {
    e.preventDefault();
    
    const donorId = document.getElementById('donationDonorId').value;
    const donationDate = document.getElementById('donationDate').value;
    const amount = document.getElementById('donationAmount').value;
    const notes = document.getElementById('donationNotes').value.trim();
    
    if (!donorId) {
        showNotification('يرجى اختيار متبرع', 'error');
        return;
    }
    
    const donor = donors.find(d => d.id === donorId);
    
    const donationData = {
        donorId: donorId,
        donorName: donor.name,
        bloodType: donor.bloodType,
        amount: parseInt(amount),
        donationDate: new Date(donationDate),
        notes: notes
    };
    
    try {
        await firebaseDB.addDonation(donationData);
        showNotification('تم تسجيل التبرع بنجاح', 'success');
        closeModal('addDonationModal');
        document.getElementById('addDonationForm').reset();
        loadData(); // إعادة تحميل البيانات
    } catch (error) {
        console.error('Error adding donation:', error);
        showNotification('حدث خطأ في تسجيل التبرع', 'error');
    }
}

// معالجة إصدار شيك دم جديد
async function handleAddVoucher(e) {
    e.preventDefault();
    
    const donorId = document.getElementById('voucherDonorId').value;
    const amount = document.getElementById('voucherAmount').value;
    const notes = document.getElementById('voucherNotes').value.trim();
    
    if (!donorId) {
        showNotification('يرجى اختيار متبرع', 'error');
        return;
    }
    
    const donor = donors.find(d => d.id === donorId);
    
    const voucherData = {
        donorId: donorId,
        donorName: donor.name,
        bloodType: donor.bloodType,
        amount: parseInt(amount),
        notes: notes
    };
    
    try {
        const result = await firebaseDB.addVoucher(voucherData);
        
        // تحديث آخر تبرع للمتبرع (إصدار شيك يعتبر تبرعاً)
        await firebaseDB.updateDonor(donorId, {
            lastDonation: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification(`تم إصدار شيك الدم رقم: ${result.voucherNumber}`, 'success');
        closeModal('addVoucherModal');
        document.getElementById('addVoucherForm').reset();
        loadData(); // إعادة تحميل البيانات
    } catch (error) {
        console.error('Error adding voucher:', error);
        showNotification('حدث خطأ في إصدار شيك الدم', 'error');
    }
}

// معالجة تسجيل الدخول
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (auth.login(username, password)) {
        localStorage.setItem('isLoggedIn', 'true');
        showNotification('تم تسجيل الدخول بنجاح', 'success');
        closeModal('loginModal');
        document.getElementById('loginForm').reset();
        updateLoginButton();
        loadData(); // تحميل البيانات بعد الدخول
    } else {
        showNotification('بيانات الدخول غير صحيحة', 'error');
    }
}

// عرض نافذة منبثقة
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// إغلاق نافذة منبثقة
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// عرض رسالة تنبيه
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// دوال مساعدة

// تنسيق التاريخ
function formatDate(date) {
    if (!date) return 'غير محدد';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ar-SA');
}

// تنسيق الوقت
function formatTime(date) {
    if (!date) return 'غير محدد';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

// التحقق من صحة رقم الهاتف
function validatePhone(phone) {
    const phoneRegex = /^01[0-2,5]\d{8}$/;
    return phoneRegex.test(phone);
}

// التحقق من صحة الاسم
function validateName(name) {
    return name.length >= 3 && name.length <= 50;
}

// تصدير الدوال للاستخدام في HTML
window.showModal = showModal;
window.closeModal = closeModal;
window.showNotification = showNotification;

// وظائف إضافية جديدة

// تحميل قائمة المتبرعين الكاملة
async function loadDonorsList() {
    try {
        const allDonors = await firebaseDB.getDonors();
        window.allDonorsData = allDonors; // تخزين البيانات للفلترة
        displayFilteredDonors(allDonors);
    } catch (error) {
        console.error('Error loading donors list:', error);
        showNotification('حدث خطأ في تحميل قائمة المتبرعين', 'error');
    }
}

// عرض قائمة المتبرعين مع الفلترة
function displayFilteredDonors(donorsList) {
    const container = document.getElementById('donorsList');
    
    if (donorsList.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد متبرعين مطابقين للفلاتر</p>';
        return;
    }
    
    const html = donorsList.map(donor => {
        const lastDonation = donor.lastDonation ? formatDate(donor.lastDonation) : 'لم يتبرع بعد';
        const totalDonations = donor.totalDonations || 0;
        const isEligible = checkDonorEligibility(donor.lastDonation);
        const eligibilityStatus = isEligible ? 
            '<span style="color: #2ecc71;">✅ متاح للتبرع</span>' : 
            '<span style="color: #e74c3c;">❌ غير متاح</span>';
        
        const notesDisplay = donor.notes ? 
            `<div class="item-notes">📝 ${donor.notes.substring(0, 50)}${donor.notes.length > 50 ? '...' : ''}</div>` : '';
        
        return `
            <div class="donor-item">
                <div class="donor-header">
                    <span class="donor-name">${donor.name}</span>
                    <span class="blood-type-badge">${donor.bloodType}</span>
                </div>
                <div class="donor-info">
                    <span class="donor-phone">📱 ${donor.phone}</span>
                    <div class="donor-actions">
                        <button class="call-btn" onclick="callDonor('${donor.phone}')">📞 اتصال</button>
                        <button class="edit-btn" onclick="editDonor('${donor.id}')">تعديل</button>
                        <button class="delete-btn" onclick="deleteDonor('${donor.id}')">حذف</button>
                    </div>
                </div>
                <div class="donor-details">
                    آخر تبرع: ${lastDonation} | إجمالي التبرعات: ${totalDonations}
                </div>
                <div class="donor-eligibility">
                    ${eligibilityStatus}
                </div>
                ${notesDisplay}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// التحقق من أهلية المتبرع للتبرع
function checkDonorEligibility(lastDonationDate) {
    if (!lastDonationDate) return true; // لم يتبرع من قبل
    
    const lastDonation = lastDonationDate.toDate ? 
        lastDonationDate.toDate() : 
        (lastDonationDate instanceof Date ? lastDonationDate : new Date(lastDonationDate));
    
    const now = new Date();
    const daysSinceLastDonation = Math.floor((now - lastDonation) / (1000 * 60 * 60 * 24));
    
    return daysSinceLastDonation >= 56; // 56 يوماً = 8 أسابيع
}

// فلترة المتبرعين
function filterDonors() {
    if (!window.allDonorsData) return;
    
    const searchTerm = document.getElementById('searchDonors').value.toLowerCase();
    const bloodTypeFilter = document.getElementById('bloodTypeFilter').value;
    const eligibilityFilter = document.getElementById('eligibilityFilter').value;
    
    let filteredDonors = window.allDonorsData.filter(donor => {
        // فلترة البحث
        const matchesSearch = !searchTerm || 
            donor.name.toLowerCase().includes(searchTerm) || 
            donor.phone.includes(searchTerm);
        
        // فلترة فصيلة الدم
        const matchesBloodType = !bloodTypeFilter || donor.bloodType === bloodTypeFilter;
        
        // فلترة الأهلية
        let matchesEligibility = true;
        if (eligibilityFilter === 'eligible') {
            matchesEligibility = checkDonorEligibility(donor.lastDonation);
        } else if (eligibilityFilter === 'not-eligible') {
            matchesEligibility = !checkDonorEligibility(donor.lastDonation);
        }
        
        return matchesSearch && matchesBloodType && matchesEligibility;
    });
    
    displayFilteredDonors(filteredDonors);
}

// وظائف البحث عن المتبرعين
async function loadDonorsForDonation() {
    try {
        const allDonors = await firebaseDB.getDonors();
        window.donationDonorsData = allDonors;
    } catch (error) {
        console.error('Error loading donors for donation:', error);
    }
}

async function loadDonorsForVoucher() {
    try {
        const allDonors = await firebaseDB.getDonors();
        window.voucherDonorsData = allDonors;
    } catch (error) {
        console.error('Error loading donors for voucher:', error);
    }
}

function searchDonors(inputId, type) {
    const searchTerm = document.getElementById(inputId).value.toLowerCase();
    const resultsContainer = document.getElementById(inputId.replace('Search', 'Results'));
    const donorsData = type === 'donation' ? window.donationDonorsData : window.voucherDonorsData;
    
    if (!searchTerm || !donorsData) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    const filteredDonors = donorsData.filter(donor => 
        donor.name.toLowerCase().includes(searchTerm) ||
        donor.phone.includes(searchTerm)
    );
    
    if (filteredDonors.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-item">لا توجد نتائج</div>';
        resultsContainer.style.display = 'block';
        return;
    }
    
    const html = filteredDonors.map(donor => `
        <div class="search-result-item" onclick="selectDonor('${donor.id}', '${donor.name}', '${type}')">
            <div class="donor-name">${donor.name}</div>
            <div class="donor-info">${donor.phone} - ${donor.bloodType}</div>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
}

function selectDonor(donorId, donorName, type) {
    if (type === 'donation') {
        document.getElementById('donationDonorId').value = donorId;
        document.getElementById('donationDonorSearch').value = donorName;
        document.getElementById('donationDonorResults').style.display = 'none';
    } else if (type === 'voucher') {
        document.getElementById('voucherDonorId').value = donorId;
        document.getElementById('voucherDonorSearch').value = donorName;
        document.getElementById('voucherDonorResults').style.display = 'none';
    }
}

function selectDonorForStats(donorId, donorName) {
    document.getElementById('donorStatsId').value = donorId;
    document.getElementById('donorStatsSearch').value = donorName;
    document.getElementById('donorStatsResults').style.display = 'none';
}

// وظائف الإحصائيات
async function generateStatistics() {
    const statsType = document.getElementById('statsType').value;
    const statsPeriod = document.getElementById('statsPeriod').value;
    const startDate = document.getElementById('statsStartDate').value;
    const endDate = document.getElementById('statsEndDate').value;
    
    const contentContainer = document.getElementById('statisticsContent');
    contentContainer.innerHTML = '<div class="stats-loading"><p>جاري تحميل الإحصائيات...</p></div>';
    
    try {
        let statsHtml = '';
        
        switch (statsType) {
            case 'overview':
                statsHtml = await generateOverviewStats(statsPeriod, startDate, endDate);
                break;
            case 'donors':
                statsHtml = await generateDonorsStats(statsPeriod, startDate, endDate);
                break;
            case 'donations':
                statsHtml = await generateDonationsStats(statsPeriod, startDate, endDate);
                break;
            case 'vouchers':
                statsHtml = await generateVouchersStats(statsPeriod, startDate, endDate);
                break;
            case 'bloodTypes':
                statsHtml = await generateBloodTypesStats(statsPeriod, startDate, endDate);
                break;
            case 'namesList':
                const namesListType = document.getElementById('namesListType').value;
                statsHtml = await generateNamesList(namesListType, statsPeriod, startDate, endDate);
                break;
            case 'donorStats':
                const donorId = document.getElementById('donorStatsId').value;
                if (!donorId) {
                    statsHtml = '<div class="stats-loading"><p>يرجى اختيار متبرع أولاً</p></div>';
                } else {
                    statsHtml = await generateDonorStats(donorId, statsPeriod, startDate, endDate);
                }
                break;
        }
        
        contentContainer.innerHTML = statsHtml;
    } catch (error) {
        console.error('Error generating statistics:', error);
        contentContainer.innerHTML = '<div class="stats-loading"><p>حدث خطأ في تحميل الإحصائيات</p></div>';
    }
}

async function generateOverviewStats(period, startDate, endDate) {
    const [donorsData, donationsData, vouchersData] = await Promise.all([
        firebaseDB.getDonors(),
        firebaseDB.getDonations(),
        firebaseDB.getVouchers()
    ]);
    
    const filteredDonations = filterDataByDate(donationsData, period, startDate, endDate, 'donationDate');
    const filteredVouchers = filterDataByDate(vouchersData, period, startDate, endDate, 'issueDate');
    
    const totalDonations = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalVouchers = filteredVouchers.reduce((sum, v) => sum + v.amount, 0);
    const redeemedVouchers = filteredVouchers.filter(v => v.status === 'redeemed').length;
    
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>إجمالي المتبرعين</h3>
                <p class="stat-value">${donorsData.length}</p>
                <p class="stat-label">متبرع مسجل</p>
            </div>
            <div class="stat-card">
                <h3>إجمالي التبرعات</h3>
                <p class="stat-value">${totalDonations}</p>
                <p class="stat-label">وحدة دم</p>
            </div>
            <div class="stat-card">
                <h3>إجمالي الشيكات</h3>
                <p class="stat-value">${totalVouchers}</p>
                <p class="stat-label">وحدة دم</p>
            </div>
            <div class="stat-card">
                <h3>الشيكات المصروفة</h3>
                <p class="stat-value">${redeemedVouchers}</p>
                <p class="stat-label">شيك</p>
            </div>
        </div>
    `;
}

async function generateDonorsStats(period, startDate, endDate) {
    const donorsData = await firebaseDB.getDonors();
    const eligibleDonors = donorsData.filter(d => checkDonorEligibility(d.lastDonation));
    
    const bloodTypeStats = {};
    donorsData.forEach(donor => {
        bloodTypeStats[donor.bloodType] = (bloodTypeStats[donor.bloodType] || 0) + 1;
    });
    
    let tableHtml = '<table class="stats-table"><tr><th>فصيلة الدم</th><th>عدد المتبرعين</th></tr>';
    for (const [bloodType, count] of Object.entries(bloodTypeStats)) {
        tableHtml += `<tr><td>${bloodType}</td><td>${count}</td></tr>`;
    }
    tableHtml += '</table>';
    
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>إجمالي المتبرعين</h3>
                <p class="stat-value">${donorsData.length}</p>
                <p class="stat-label">متبرع مسجل</p>
            </div>
            <div class="stat-card">
                <h3>المتبرعون المتاحون</h3>
                <p class="stat-value">${eligibleDonors.length}</p>
                <p class="stat-label">متاح للتبرع</p>
            </div>
        </div>
        <h3>توزيع المتبرعين حسب فصيلة الدم</h3>
        ${tableHtml}
    `;
}

async function generateDonationsStats(period, startDate, endDate) {
    const donationsData = await firebaseDB.getDonations();
    const filteredDonations = filterDataByDate(donationsData, period, startDate, endDate, 'donationDate');
    
    const totalAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const avgAmount = filteredDonations.length > 0 ? (totalAmount / filteredDonations.length).toFixed(1) : 0;
    
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>عدد التبرعات</h3>
                <p class="stat-value">${filteredDonations.length}</p>
                <p class="stat-label">عملية تبرع</p>
            </div>
            <div class="stat-card">
                <h3>إجمالي الوحدات</h3>
                <p class="stat-value">${totalAmount}</p>
                <p class="stat-label">وحدة دم</p>
            </div>
            <div class="stat-card">
                <h3>متوسط التبرع</h3>
                <p class="stat-value">${avgAmount}</p>
                <p class="stat-label">وحدة بالعملية</p>
            </div>
        </div>
    `;
}

async function generateVouchersStats(period, startDate, endDate) {
    const vouchersData = await firebaseDB.getVouchers();
    const filteredVouchers = filterDataByDate(vouchersData, period, startDate, endDate, 'issueDate');
    
    const issuedVouchers = filteredVouchers.filter(v => v.status === 'issued');
    const redeemedVouchers = filteredVouchers.filter(v => v.status === 'redeemed');
    const totalAmount = filteredVouchers.reduce((sum, v) => sum + v.amount, 0);
    
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>الشيكات الصادرة</h3>
                <p class="stat-value">${filteredVouchers.length}</p>
                <p class="stat-label">شيك</p>
            </div>
            <div class="stat-card">
                <h3>الشيكات المصروفة</h3>
                <p class="stat-value">${redeemedVouchers.length}</p>
                <p class="stat-label">شيك</p>
            </div>
            <div class="stat-card">
                <h3>الشيكات المتبقية</h3>
                <p class="stat-value">${issuedVouchers.length}</p>
                <p class="stat-label">شيك صالح</p>
            </div>
            <div class="stat-card">
                <h3>إجمالي الوحدات</h3>
                <p class="stat-value">${totalAmount}</p>
                <p class="stat-label">وحدة دم</p>
            </div>
        </div>
    `;
}

async function generateBloodTypesStats(period, startDate, endDate) {
    const donationsData = await firebaseDB.getDonations();
    const filteredDonations = filterDataByDate(donationsData, period, startDate, endDate, 'donationDate');
    
    const bloodTypeStats = {};
    filteredDonations.forEach(donation => {
        bloodTypeStats[donation.bloodType] = (bloodTypeStats[donation.bloodType] || 0) + donation.amount;
    });
    
    let tableHtml = '<table class="stats-table"><tr><th>فصيلة الدم</th><th>إجمالي الوحدات</th><th>نسبة المئوية</th></tr>';
    const totalUnits = Object.values(bloodTypeStats).reduce((sum, amount) => sum + amount, 0);
    
    for (const [bloodType, amount] of Object.entries(bloodTypeStats)) {
        const percentage = totalUnits > 0 ? ((amount / totalUnits) * 100).toFixed(1) : 0;
        tableHtml += `<tr><td>${bloodType}</td><td>${amount}</td><td>${percentage}%</td></tr>`;
    }
    tableHtml += '</table>';
    
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>إجمالي الوحدات</h3>
                <p class="stat-value">${totalUnits}</p>
                <p class="stat-label">وحدة دم</p>
            </div>
        </div>
        <h3>توزيع الوحدات حسب فصيلة الدم</h3>
        ${tableHtml}
    `;
}

function filterDataByDate(data, period, startDate, endDate, dateField) {
    if (period === 'all' && !startDate && !endDate) return data;
    
    const now = new Date();
    let filterStart, filterEnd;
    
    if (period === 'today') {
        filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (period === 'week') {
        filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filterEnd = now;
    } else if (period === 'month') {
        filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filterEnd = now;
    } else if (period === 'year') {
        filterStart = new Date(now.getFullYear(), 0, 1);
        filterEnd = now;
    } else {
        filterStart = startDate ? new Date(startDate) : null;
        filterEnd = endDate ? new Date(endDate + 'T23:59:59') : now;
    }
    
    return data.filter(item => {
        const itemDate = item[dateField] ? 
            (item[dateField].toDate ? item[dateField].toDate() : new Date(item[dateField])) : 
            null;
        
        if (!itemDate) return false;
        
        if (filterStart && itemDate < filterStart) return false;
        if (filterEnd && itemDate > filterEnd) return false;
        
        return true;
    });
}

async function generateDonorStats(donorId, period, startDate, endDate) {
    const [donorsData, donationsData, vouchersData] = await Promise.all([
        firebaseDB.getDonors(),
        firebaseDB.getDonations(),
        firebaseDB.getVouchers()
    ]);
    
    const donor = donorsData.find(d => d.id === donorId);
    if (!donor) {
        return '<div class="stats-loading"><p>المتبرع غير موجود</p></div>';
    }
    
    const donorDonations = donationsData.filter(d => d.donorId === donorId);
    const donorVouchers = vouchersData.filter(v => v.donorId === donorId);
    
    const filteredDonations = filterDataByDate(donorDonations, period, startDate, endDate, 'donationDate');
    const filteredVouchers = filterDataByDate(donorVouchers, period, startDate, endDate, 'issueDate');
    
    const totalDonationsAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalVouchersAmount = filteredVouchers.reduce((sum, v) => sum + v.amount, 0);
    const redeemedVouchers = filteredVouchers.filter(v => v.status === 'redeemed');
    const redeemedAmount = redeemedVouchers.reduce((sum, v) => sum + v.amount, 0);
    
    const dateRange = getDateRangeText(period, startDate, endDate);
    
    let html = `
        <div class="donor-stats-header">
            <h2>إحصائيات المتبرع: ${donor.name}</h2>
            <p class="donor-info">📱 ${donor.phone} | 🩸 ${donor.bloodType}</p>
            <p class="date-range">${dateRange}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>عدد التبرعات</h3>
                <p class="stat-value">${filteredDonations.length}</p>
                <p class="stat-label">عملية تبرع</p>
            </div>
            <div class="stat-card">
                <h3>إجمالي التبرعات</h3>
                <p class="stat-value">${totalDonationsAmount}</p>
                <p class="stat-label">وحدة دم</p>
            </div>
            <div class="stat-card">
                <h3>عدد الشيكات</h3>
                <p class="stat-value">${filteredVouchers.length}</p>
                <p class="stat-label">شيك دم</p>
            </div>
            <div class="stat-card">
                <h3>إجمالي الشيكات</h3>
                <p class="stat-value">${totalVouchersAmount}</p>
                <p class="stat-label">وحدة دم</p>
            </div>
        </div>
    `;
    
    // جدول التبرعات
    if (filteredDonations.length > 0) {
        html += `
            <h3>سجل التبرعات</h3>
            <table class="stats-table names-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>التاريخ</th>
                        <th>الكمية</th>
                        <th>ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        filteredDonations.forEach((donation, index) => {
            const date = donation.donationDate ? 
                new Date(donation.donationDate.toDate ? donation.donationDate.toDate() : donation.donationDate).toLocaleDateString('ar-SA') : 
                'غير محدد';
            const notes = donation.notes ? donation.notes.substring(0, 50) + (donation.notes.length > 50 ? '...' : '') : '-';
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${date}</td>
                    <td>${donation.amount} وحدة</td>
                    <td>${notes}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
    }
    
    // جدول الشيكات
    if (filteredVouchers.length > 0) {
        html += `
            <h3>سجل الشيكات</h3>
            <table class="stats-table names-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>رقم الشيك</th>
                        <th>تاريخ الإصدار</th>
                        <th>الكمية</th>
                        <th>الحالة</th>
                        <th>ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        filteredVouchers.forEach((voucher, index) => {
            const date = voucher.issueDate ? formatDate(voucher.issueDate) : 'غير محدد';
            const statusText = getStatusText(voucher.status);
            const notes = voucher.notes ? voucher.notes.substring(0, 50) + (voucher.notes.length > 50 ? '...' : '') : '-';
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${voucher.voucherNumber}</td>
                    <td>${date}</td>
                    <td>${voucher.amount} وحدة</td>
                    <td>${statusText}</td>
                    <td>${notes}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
    }
    
    // جدول الشيكات المصروفة
    if (redeemedVouchers.length > 0) {
        html += `
            <h3>الشيكات المصروفة</h3>
            <table class="stats-table names-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>رقم الشيك</th>
                        <th>تاريخ الصرف</th>
                        <th>الكمية</th>
                        <th>المستفيد</th>
                        <th>الغرض</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        redeemedVouchers.forEach((voucher, index) => {
            const date = voucher.redemptionDate ? 
                new Date(voucher.redemptionDate.toDate ? voucher.redemptionDate.toDate() : voucher.redemptionDate).toLocaleDateString('ar-SA') : 
                'غير محدد';
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${voucher.voucherNumber}</td>
                    <td>${date}</td>
                    <td>${voucher.amount} وحدة</td>
                    <td>${voucher.beneficiaryName || '-'}</td>
                    <td>${voucher.redemptionPurpose || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
    }
    
    // ملخص إجمالي
    html += `
        <div class="donor-summary">
            <h3>ملخص إجمالي</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <strong>إجمالي الوحدات المتبرعة:</strong> ${totalDonationsAmount} وحدة
                </div>
                <div class="summary-item">
                    <strong>إجمالي الشيكات الصادرة:</strong> ${totalVouchersAmount} وحدة
                </div>
                <div class="summary-item">
                    <strong>الشيكات المصروفة:</strong> ${redeemedAmount} وحدة
                </div>
                <div class="summary-item">
                    <strong>صافي الوحدات:</strong> ${totalVouchersAmount - redeemedAmount} وحدة
                </div>
            </div>
        </div>
    `;
    
    return html;
}

async function generateNamesList(listType, period, startDate, endDate) {
    const [donorsData, donationsData, vouchersData] = await Promise.all([
        firebaseDB.getDonors(),
        firebaseDB.getDonations(),
        firebaseDB.getVouchers()
    ]);
    
    let tableHtml = '';
    let title = '';
    
    switch (listType) {
        case 'donors':
            title = 'كشف بأسماء المتبرعين';
            tableHtml = generateDonorsNamesList(donorsData, period, startDate, endDate);
            break;
        case 'donations':
            title = 'كشف بأسماء المتبرعين (التبرعات)';
            tableHtml = generateDonationsNamesList(donorsData, donationsData, period, startDate, endDate);
            break;
        case 'vouchers':
            title = 'كشف بأسماء المتبرعين (الشيكات)';
            tableHtml = generateVouchersNamesList(donorsData, vouchersData, period, startDate, endDate);
            break;
        case 'redeemedVouchers':
            title = 'كشف بأسماء المتبرعين (الشيكات المصروفة)';
            tableHtml = generateRedeemedVouchersNamesList(donorsData, vouchersData, period, startDate, endDate);
            break;
        default:
            title = 'كشف شامل بأسماء المتبرعين';
            tableHtml = generateAllNamesList(donorsData, donationsData, vouchersData, period, startDate, endDate);
    }
    
    const dateRange = getDateRangeText(period, startDate, endDate);
    
    return `
        <div class="names-list-header">
            <h2>${title}</h2>
            <p class="date-range">${dateRange}</p>
        </div>
        ${tableHtml}
    `;
}

function generateDonorsNamesList(donorsData, period, startDate, endDate) {
    let filteredDonors = donorsData;
    
    if (period !== 'all' || startDate || endDate) {
        filteredDonors = filterDataByDate(donorsData, period, startDate, endDate, 'createdAt');
    }
    
    let tableHtml = `
        <table class="stats-table names-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>اسم المتبرع</th>
                    <th>رقم الهاتف</th>
                    <th>فصيلة الدم</th>
                    <th>آخر تبرع</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredDonors.forEach((donor, index) => {
        const lastDonation = donor.lastDonation ? formatDate(donor.lastDonation) : 'لم يتبرع بعد';
        const isEligible = checkDonorEligibility(donor.lastDonation);
        const status = isEligible ? '✅ متاح' : '❌ غير متاح';
        
        tableHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${donor.name}</td>
                <td>${donor.phone}</td>
                <td><span class="blood-type-badge">${donor.bloodType}</span></td>
                <td>${lastDonation}</td>
                <td>${status}</td>
            </tr>
        `;
    });
    
    tableHtml += '</tbody></table>';
    tableHtml += `<p class="total-count">إجمالي: ${filteredDonors.length} متبرع</p>`;
    
    return tableHtml;
}

function generateDonationsNamesList(donorsData, donationsData, period, startDate, endDate) {
    const filteredDonations = filterDataByDate(donationsData, period, startDate, endDate, 'donationDate');
    
    let tableHtml = `
        <table class="stats-table names-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>اسم المتبرع</th>
                    <th>رقم الهاتف</th>
                    <th>فصيلة الدم</th>
                    <th>تاريخ التبرع</th>
                    <th>الكمية</th>
                    <th>ملاحظات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredDonations.forEach((donation, index) => {
        const donor = donorsData.find(d => d.id === donation.donorId);
        const date = donation.donationDate ? 
            new Date(donation.donationDate.toDate ? donation.donationDate.toDate() : donation.donationDate).toLocaleDateString('ar-SA') : 
            'غير محدد';
        const notes = donation.notes ? donation.notes.substring(0, 50) + (donation.notes.length > 50 ? '...' : '') : '-';
        
        tableHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${donor ? donor.name : 'غير معروف'}</td>
                <td>${donor ? donor.phone : '-'}</td>
                <td><span class="blood-type-badge">${donor ? donor.bloodType : '-'}</span></td>
                <td>${date}</td>
                <td>${donation.amount} وحدة</td>
                <td>${notes}</td>
            </tr>
        `;
    });
    
    tableHtml += '</tbody></table>';
    const totalAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    tableHtml += `<p class="total-count">إجمالي: ${filteredDonations.length} تبرع | ${totalAmount} وحدة دم</p>`;
    
    return tableHtml;
}

function generateVouchersNamesList(donorsData, vouchersData, period, startDate, endDate) {
    const filteredVouchers = filterDataByDate(vouchersData, period, startDate, endDate, 'issueDate');
    
    let tableHtml = `
        <table class="stats-table names-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>اسم المتبرع</th>
                    <th>رقم الهاتف</th>
                    <th>فصيلة الدم</th>
                    <th>رقم الشيك</th>
                    <th>تاريخ الإصدار</th>
                    <th>الكمية</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredVouchers.forEach((voucher, index) => {
        const donor = donorsData.find(d => d.id === voucher.donorId);
        const date = voucher.issueDate ? formatDate(voucher.issueDate) : 'غير محدد';
        const statusText = getStatusText(voucher.status);
        
        tableHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${donor ? donor.name : 'غير معروف'}</td>
                <td>${donor ? donor.phone : '-'}</td>
                <td><span class="blood-type-badge">${donor ? donor.bloodType : '-'}</span></td>
                <td>${voucher.voucherNumber}</td>
                <td>${date}</td>
                <td>${voucher.amount} وحدة</td>
                <td>${statusText}</td>
            </tr>
        `;
    });
    
    tableHtml += '</tbody></table>';
    const totalAmount = filteredVouchers.reduce((sum, v) => sum + v.amount, 0);
    tableHtml += `<p class="total-count">إجمالي: ${filteredVouchers.length} شيك | ${totalAmount} وحدة دم</p>`;
    
    return tableHtml;
}

function generateRedeemedVouchersNamesList(donorsData, vouchersData, period, startDate, endDate) {
    const redeemedVouchers = vouchersData.filter(v => v.status === 'redeemed');
    const filteredVouchers = filterDataByDate(redeemedVouchers, period, startDate, endDate, 'redemptionDate');
    
    let tableHtml = `
        <table class="stats-table names-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>اسم المتبرع</th>
                    <th>رقم الهاتف</th>
                    <th>فصيلة الدم</th>
                    <th>رقم الشيك</th>
                    <th>تاريخ الصرف</th>
                    <th>الكمية</th>
                    <th>المستفيد</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredVouchers.forEach((voucher, index) => {
        const donor = donorsData.find(d => d.id === voucher.donorId);
        const date = voucher.redemptionDate ? 
            new Date(voucher.redemptionDate.toDate ? voucher.redemptionDate.toDate() : voucher.redemptionDate).toLocaleDateString('ar-SA') : 
            'غير محدد';
        
        tableHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${donor ? donor.name : 'غير معروف'}</td>
                <td>${donor ? donor.phone : '-'}</td>
                <td><span class="blood-type-badge">${donor ? donor.bloodType : '-'}</span></td>
                <td>${voucher.voucherNumber}</td>
                <td>${date}</td>
                <td>${voucher.amount} وحدة</td>
                <td>${voucher.beneficiaryName || '-'}</td>
            </tr>
        `;
    });
    
    tableHtml += '</tbody></table>';
    const totalAmount = filteredVouchers.reduce((sum, v) => sum + v.amount, 0);
    tableHtml += `<p class="total-count">إجمالي: ${filteredVouchers.length} شيك مصروف | ${totalAmount} وحدة دم</p>`;
    
    return tableHtml;
}

function generateAllNamesList(donorsData, donationsData, vouchersData, period, startDate, endDate) {
    const filteredDonations = filterDataByDate(donationsData, period, startDate, endDate, 'donationDate');
    const filteredVouchers = filterDataByDate(vouchersData, period, startDate, endDate, 'issueDate');
    
    let tableHtml = `
        <table class="stats-table names-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>اسم المتبرع</th>
                    <th>رقم الهاتف</th>
                    <th>فصيلة الدم</th>
                    <th>عدد التبرعات</th>
                    <th>إجمالي الوحدات</th>
                    <th>عدد الشيكات</th>
                    <th>وحدات الشيكات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const donorStats = {};
    
    // حساب إحصائيات التبرعات
    filteredDonations.forEach(donation => {
        if (!donorStats[donation.donorId]) {
            const donor = donorsData.find(d => d.id === donation.donorId);
            donorStats[donation.donorId] = {
                name: donor ? donor.name : 'غير معروف',
                phone: donor ? donor.phone : '-',
                bloodType: donor ? donor.bloodType : '-',
                donationsCount: 0,
                donationsAmount: 0,
                vouchersCount: 0,
                vouchersAmount: 0
            };
        }
        donorStats[donation.donorId].donationsCount++;
        donorStats[donation.donorId].donationsAmount += donation.amount;
    });
    
    // حساب إحصائيات الشيكات
    filteredVouchers.forEach(voucher => {
        if (!donorStats[voucher.donorId]) {
            const donor = donorsData.find(d => d.id === voucher.donorId);
            donorStats[voucher.donorId] = {
                name: donor ? donor.name : 'غير معروف',
                phone: donor ? donor.phone : '-',
                bloodType: donor ? donor.bloodType : '-',
                donationsCount: 0,
                donationsAmount: 0,
                vouchersCount: 0,
                vouchersAmount: 0
            };
        }
        donorStats[voucher.donorId].vouchersCount++;
        donorStats[voucher.donorId].vouchersAmount += voucher.amount;
    });
    
    let index = 1;
    for (const [donorId, stats] of Object.entries(donorStats)) {
        tableHtml += `
            <tr>
                <td>${index++}</td>
                <td>${stats.name}</td>
                <td>${stats.phone}</td>
                <td><span class="blood-type-badge">${stats.bloodType}</span></td>
                <td>${stats.donationsCount}</td>
                <td>${stats.donationsAmount} وحدة</td>
                <td>${stats.vouchersCount}</td>
                <td>${stats.vouchersAmount} وحدة</td>
            </tr>
        `;
    }
    
    tableHtml += '</tbody></table>';
    tableHtml += `<p class="total-count">إجمالي: ${Object.keys(donorStats).length} متبرع</p>`;
    
    return tableHtml;
}

function getDateRangeText(period, startDate, endDate) {
    if (startDate && endDate) {
        return `الفترة: من ${new Date(startDate).toLocaleDateString('ar-SA')} إلى ${new Date(endDate).toLocaleDateString('ar-SA')}`;
    }
    
    switch (period) {
        case 'today':
            return 'الفترة: اليوم';
        case 'week':
            return 'الفترة: هذا الأسبوع';
        case 'month':
            return 'الفترة: هذا الشهر';
        case 'year':
            return 'الفترة: هذا العام';
        default:
            return 'الفترة: جميع الفترات';
    }
}

function printStatistics() {
    window.print();
}

function clearStatisticsFilters() {
    document.getElementById('statsType').value = 'overview';
    document.getElementById('statsPeriod').value = 'all';
    document.getElementById('statsStartDate').value = '';
    document.getElementById('statsEndDate').value = '';
    document.getElementById('statisticsContent').innerHTML = '<div class="stats-loading"><p>يرجى اختيار الفلاتر وضغط "توليد الإحصائيات"</p></div>';
}

// وظائف الدعوات
let currentInvitationData = null;

function handleCreateInvitation(e) {
    e.preventDefault();
    
    const formData = {
        campaignName: document.getElementById('campaignName').value,
        bloodType: document.getElementById('bloodType').value,
        hospitalName: document.getElementById('hospitalName').value,
        donationDate: document.getElementById('donationDate').value,
        donationTime: document.getElementById('donationTime').value,
        contactNumber: document.getElementById('contactNumber').value,
        invitationMessage: document.getElementById('invitationMessage').value
    };
    
    currentInvitationData = formData;
    generateInvitationPreview(formData);
    
    closeModal('invitationModal');
    showModal('invitationPreviewModal');
}

function generateInvitationPreview(data) {
    const date = data.donationDate ? new Date(data.donationDate).toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'سيتم تحديده لاحقاً';
    
    const time = data.donationTime || 'سيتم تحديده لاحقاً';
    const hospital = data.hospitalName || 'مكان التبرع';
    const contact = data.contactNumber || 'رقم الاتصال';
    const message = data.invitationMessage || 'تبرعك يإنقاذ حياة. كن بطلاً اليوم!';
    
    let detailsHTML = `
        <div class="detail-item">
            <span class="icon">🏥</span>
            <span>${hospital}</span>
        </div>
    `;
    
    if (data.donationDate) {
        detailsHTML += `
            <div class="detail-item">
                <span class="icon">📅</span>
                <span>${date}</span>
            </div>
        `;
    }
    
    if (data.donationTime) {
        detailsHTML += `
            <div class="detail-item">
                <span class="icon">⏰</span>
                <span>${time}</span>
            </div>
        `;
    }
    
    if (data.contactNumber) {
        detailsHTML += `
            <div class="detail-item">
                <span class="icon">�</span>
                <span>${contact}</span>
            </div>
        `;
    }
    
    const invitationHTML = `
        <div class="invitation-header">
            <h2>🩸 دعوة للتبرع بالدم</h2>
            <p class="subtitle">${data.campaignName}</p>
        </div>
        
        <div class="blood-type-highlight">
            فصيلة الدم المطلوبة: ${data.bloodType}
        </div>
        
        <div class="invitation-details">
            <h3>📍 تفاصيل الحملة</h3>
            ${detailsHTML}
        </div>
        
        <div class="invitation-message">
            "${message}"
        </div>
        
        <div class="invitation-footer">
            <p>💙 معاً لإنقاذ الأرواح</p>
            <p>بنك الدم - ${new Date().getFullYear()}</p>
        </div>
    `;
    
    document.getElementById('invitationPreview').innerHTML = invitationHTML;
}

function shareInvitation() {
    if (!currentInvitationData) return;
    
    const shareText = generateInvitationText(currentInvitationData);
    
    if (navigator.share) {
        navigator.share({
            title: 'دعوة للتبرع بالدم',
            text: shareText,
            url: window.location.href
        }).then(() => {
            showNotification('تمت مشاركة الدعوة بنجاح', 'success');
        }).catch(() => {
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

function downloadInvitation() {
    const element = document.getElementById('invitationPreview');
    
    html2canvas(element).then(canvas => {
        const link = document.createElement('a');
        link.download = `دعوة-تبرع-${currentInvitationData.campaignName}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        showNotification('تم حفظ الدعوة كصورة', 'success');
    }).catch(() => {
        showNotification('لا يمكن حفظ الصورة. يرجى استخدام نسخ النص.', 'error');
    });
}

function copyInvitationText() {
    if (!currentInvitationData) return;
    
    const shareText = generateInvitationText(currentInvitationData);
    copyToClipboard(shareText);
}

function generateInvitationText(data) {
    const date = data.donationDate ? new Date(data.donationDate).toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    
    const time = data.donationTime || '';
    const hospital = data.hospitalName || '';
    const contact = data.contactNumber || '';
    const message = data.invitationMessage || 'تبرعك يإنقاذ حياة. كن بطلاً اليوم!';
    
    let detailsText = '';
    
    if (hospital) {
        detailsText += `🏥 المكان: ${hospital}\n`;
    }
    
    if (date) {
        detailsText += `📅 التاريخ: ${date}\n`;
    }
    
    if (time) {
        detailsText += `⏰ الوقت: ${time}\n`;
    }
    
    if (contact) {
        detailsText += `📞 للتواصل: ${contact}\n`;
    }
    
    return `🩸 دعوة للتبرع بالدم 🩸

${data.campaignName}

فصيلة الدم المطلوبة: ${data.bloodType}

${detailsText}"${message}"

💙 معاً لإنقاذ الأرواح
بنك الدم - ${new Date().getFullYear()}`;
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    showNotification('تم نسخ الدعوة', 'success');
}
function clearAllFilters() {
    document.getElementById('searchDonors').value = '';
    document.getElementById('bloodTypeFilter').value = '';
    document.getElementById('eligibilityFilter').value = 'all';
    
    if (window.allDonorsData) {
        displayFilteredDonors(window.allDonorsData);
    }
}

// البحث في قائمة المتبرعين
function handleSearchDonors(e) {
    const searchTerm = e.target.value.toLowerCase();
    const donorItems = document.querySelectorAll('.donor-item');
    
    donorItems.forEach(item => {
        const name = item.querySelector('.donor-name').textContent.toLowerCase();
        const phone = item.querySelector('.donor-phone').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || phone.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// الاتصال بالمتبرع
function callDonor(phone) {
    // إزالة أي أحرف غير رقمية
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // محاولة الاتصال
    if (cleanPhone.length >= 10) {
        window.location.href = `tel:${cleanPhone}`;
    } else {
        showNotification('رقم الهاتف غير صحيح', 'error');
    }
}

// التحقق من رقم الشيك
async function handleVoucherLookup(e) {
    const voucherNumber = e.target.value.trim();
    
    if (!voucherNumber) {
        document.getElementById('voucherInfo').style.display = 'none';
        return;
    }
    
    try {
        const vouchers = await firebaseDB.getVouchers();
        const voucher = vouchers.find(v => v.voucherNumber === voucherNumber);
        
        if (voucher) {
            displayVoucherInfo(voucher);
        } else {
            showNotification('رقم الشيك غير موجود', 'error');
            document.getElementById('voucherInfo').style.display = 'none';
        }
    } catch (error) {
        console.error('Error looking up voucher:', error);
        showNotification('حدث خطأ في البحث عن الشيك', 'error');
    }
}

// عرض معلومات الشيك
function displayVoucherInfo(voucher) {
    const infoDiv = document.getElementById('voucherInfo');
    const detailsDiv = document.getElementById('voucherDetails');
    
    const issueDate = voucher.issueDate ? formatDate(voucher.issueDate) : 'غير محدد';
    const expiryDate = voucher.expiryDate ? formatDate(voucher.expiryDate) : 'غير محدد';
    
    detailsDiv.innerHTML = `
        <div class="voucher-detail">
            <span class="voucher-label">المتبرع:</span>
            <span class="voucher-value">${voucher.donorName}</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">فصيلة الدم:</span>
            <span class="voucher-value">${voucher.bloodType}</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">الكمية:</span>
            <span class="voucher-value">${voucher.amount} وحدة</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">تاريخ الإصدار:</span>
            <span class="voucher-value">${issueDate}</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">تاريخ انتهاء الصلاحية:</span>
            <span class="voucher-value">${expiryDate}</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">الحالة:</span>
            <span class="voucher-value">${getStatusText(voucher.status)}</span>
        </div>
    `;
    
    infoDiv.style.display = 'block';
}

// الحصول على نص الحالة
function getStatusText(status) {
    const statusMap = {
        'issued': 'صادر',
        'redeemed': 'مصروف',
        'expired': 'منتهي الصلاحية',
        'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
}

// تحديث قائمة الشيكات الأخيرة
function updateRecentVouchers() {
    const container = document.getElementById('recentVouchers');
    
    if (vouchers.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد شيكات</p>';
        return;
    }
    
    const html = vouchers.slice(0, 5).map(voucher => {
        const date = voucher.issueDate ? formatDate(voucher.issueDate) : 'غير محدد';
        const statusText = getStatusText(voucher.status);
        const statusColor = voucher.status === 'issued' ? '#2ecc71' : 
                           voucher.status === 'redeemed' ? '#3498db' : '#e74c3c';
        
        const notesDisplay = voucher.notes ? 
            `<div class="item-notes">📝 ${voucher.notes.substring(0, 40)}${voucher.notes.length > 40 ? '...' : ''}</div>` : '';
        
        return `
            <div class="list-item">
                <div>
                    <span class="item-name">${voucher.voucherNumber}</span>
                    <span class="item-info">${voucher.donorName} - ${voucher.amount} وحدة</span>
                    ${notesDisplay}
                </div>
                <div>
                    <span style="color: ${statusColor}; font-size: 12px;">${statusText}</span>
                    <div class="item-actions">
                        <button class="edit-btn" onclick="editVoucher('${voucher.id}')">تعديل</button>
                        <button class="delete-btn" onclick="deleteVoucher('${voucher.id}')">حذف</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// تحديث قائمة المتبرعين مع أزرار التعديل والحذف
function displayDonorsList(donorsList) {
    const container = document.getElementById('donorsList');
    
    if (donorsList.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد متبرعين</p>';
        return;
    }
    
    const html = donorsList.map(donor => {
        const lastDonation = donor.lastDonation ? formatDate(donor.lastDonation) : 'لم يتبرع بعد';
        const totalDonations = donor.totalDonations || 0;
        
        return `
            <div class="donor-item">
                <div class="donor-header">
                    <span class="donor-name">${donor.name}</span>
                    <span class="blood-type-badge">${donor.bloodType}</span>
                </div>
                <div class="donor-info">
                    <span class="donor-phone">📱 ${donor.phone}</span>
                    <div class="donor-actions">
                        <button class="call-btn" onclick="callDonor('${donor.phone}')">📞 اتصال</button>
                        <button class="edit-btn" onclick="editDonor('${donor.id}')">تعديل</button>
                        <button class="delete-btn" onclick="deleteDonor('${donor.id}')">حذف</button>
                    </div>
                </div>
                <div class="donor-details">
                    آخر تبرع: ${lastDonation} | إجمالي التبرعات: ${totalDonations}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// تحديث قائمة التبرعات مع أزرار التعديل والحذف
function updateRecentDonations() {
    const container = document.getElementById('recentDonations');
    
    if (donations.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد تبرعات</p>';
        return;
    }
    
    const html = donations.slice(0, 5).map(donation => {
        const date = donation.donationDate ? 
            new Date(donation.donationDate.toDate ? donation.donationDate.toDate() : donation.donationDate).toLocaleDateString('ar-SA') : 
            'غير محدد';
        
        const notesDisplay = donation.notes ? 
            `<div class="item-notes">📝 ${donation.notes.substring(0, 40)}${donation.notes.length > 40 ? '...' : ''}</div>` : '';
        
        return `
            <div class="list-item">
                <div>
                    <span class="item-name">${donation.donorName}</span>
                    <span class="item-info">${donation.amount} وحدة - ${date}</span>
                    ${notesDisplay}
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editDonation('${donation.id}')">تعديل</button>
                    <button class="delete-btn" onclick="deleteDonation('${donation.id}')">حذف</button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// تحميل الشيكات للصرف
async function loadVouchersForRedemption() {
    try {
        const allVouchers = await firebaseDB.getVouchers();
        const issuedVouchers = allVouchers.filter(v => v.status === 'issued');
        
        const select = document.getElementById('voucherSelect');
        select.innerHTML = '<option value="">اختر الشيك المراد صرفه</option>';
        
        issuedVouchers.forEach(voucher => {
            const option = document.createElement('option');
            option.value = voucher.id;
            option.textContent = `${voucher.voucherNumber} - ${voucher.donorName} (${voucher.amount} وحدة)`;
            select.appendChild(option);
        });
        
        if (issuedVouchers.length === 0) {
            showNotification('لا توجد شيكات صالحة للصرف', 'warning');
        }
    } catch (error) {
        console.error('Error loading vouchers for redemption:', error);
        showNotification('حدث خطأ في تحميل الشيكات', 'error');
    }
}

// اختيار الشيك للصرف
async function handleVoucherSelection(e) {
    const voucherId = e.target.value;
    
    if (!voucherId) {
        document.getElementById('voucherInfo').style.display = 'none';
        return;
    }
    
    try {
        const vouchers = await firebaseDB.getVouchers();
        const voucher = vouchers.find(v => v.id === voucherId);
        
        if (voucher) {
            displayVoucherInfo(voucher);
        }
    } catch (error) {
        console.error('Error getting voucher details:', error);
        showNotification('حدث خطأ في جلب بيانات الشيك', 'error');
    }
}

// وظائف التعديل

function editDonor(donorId) {
    const donor = donors.find(d => d.id === donorId);
    if (!donor) return;
    
    document.getElementById('editDonorId').value = donor.id;
    document.getElementById('editDonorName').value = donor.name;
    document.getElementById('editDonorPhone').value = donor.phone;
    document.getElementById('editDonorBloodType').value = donor.bloodType;
    
    showModal('editDonorModal');
}

function editDonation(donationId) {
    const donation = donations.find(d => d.id === donationId);
    if (!donation) return;
    
    document.getElementById('editDonationId').value = donation.id;
    populateDonorSelect('editDonationDonor');
    document.getElementById('editDonationDonor').value = donation.donorId;
    document.getElementById('editDonationAmount').value = donation.amount;
    
    showModal('editDonationModal');
}

function editVoucher(voucherId) {
    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher) return;
    
    document.getElementById('editVoucherId').value = voucher.id;
    populateDonorSelect('editVoucherDonor');
    document.getElementById('editVoucherDonor').value = voucher.donorId;
    document.getElementById('editVoucherAmount').value = voucher.amount;
    
    showModal('editVoucherModal');
}

// معالجات التعديل

async function handleEditDonor(e) {
    e.preventDefault();
    
    const donorId = document.getElementById('editDonorId').value;
    const donorData = {
        name: document.getElementById('editDonorName').value.trim(),
        phone: document.getElementById('editDonorPhone').value.trim(),
        bloodType: document.getElementById('editDonorBloodType').value
    };
    
    try {
        await firebaseDB.updateDonor(donorId, donorData);
        showNotification('تم تحديث بيانات المتبرع بنجاح', 'success');
        closeModal('editDonorModal');
        document.getElementById('editDonorForm').reset();
        loadData();
    } catch (error) {
        console.error('Error updating donor:', error);
        showNotification('حدث خطأ في تحديث بيانات المتبرع', 'error');
    }
}

async function handleEditDonation(e) {
    e.preventDefault();
    
    const donationId = document.getElementById('editDonationId').value;
    const donorId = document.getElementById('editDonationDonor').value;
    const amount = document.getElementById('editDonationAmount').value;
    
    const donor = donors.find(d => d.id === donorId);
    
    const donationData = {
        donorId: donorId,
        donorName: donor.name,
        bloodType: donor.bloodType,
        amount: parseInt(amount)
    };
    
    try {
        await firebaseDB.updateDonation(donationId, donationData);
        showNotification('تم تحديث بيانات التبرع بنجاح', 'success');
        closeModal('editDonationModal');
        document.getElementById('editDonationForm').reset();
        loadData();
    } catch (error) {
        console.error('Error updating donation:', error);
        showNotification('حدث خطأ في تحديث بيانات التبرع', 'error');
    }
}

async function handleEditVoucher(e) {
    e.preventDefault();
    
    const voucherId = document.getElementById('editVoucherId').value;
    const donorId = document.getElementById('editVoucherDonor').value;
    const amount = document.getElementById('editVoucherAmount').value;
    
    const donor = donors.find(d => d.id === donorId);
    
    const voucherData = {
        donorId: donorId,
        donorName: donor.name,
        bloodType: donor.bloodType,
        amount: parseInt(amount)
    };
    
    try {
        await firebaseDB.updateVoucher(voucherId, voucherData);
        showNotification('تم تحديث بيانات الشيك بنجاح', 'success');
        closeModal('editVoucherModal');
        document.getElementById('editVoucherForm').reset();
        loadData();
    } catch (error) {
        console.error('Error updating voucher:', error);
        showNotification('حدث خطأ في تحديث بيانات الشيك', 'error');
    }
}

// وظائف الحذف

async function deleteDonor(donorId) {
    if (!confirm('هل أنت متأكد من حذف هذا المتبرع؟')) return;
    
    try {
        await firebaseDB.deleteDonor(donorId);
        showNotification('تم حذف المتبرع بنجاح', 'success');
        loadData();
    } catch (error) {
        console.error('Error deleting donor:', error);
        showNotification('حدث خطأ في حذف المتبرع', 'error');
    }
}

async function deleteDonation(donationId) {
    if (!confirm('هل أنت متأكد من حذف هذا التبرع؟')) return;
    
    try {
        await firebaseDB.deleteDonation(donationId);
        showNotification('تم حذف التبرع بنجاح', 'success');
        loadData();
    } catch (error) {
        console.error('Error deleting donation:', error);
        showNotification('حدث خطأ في حذف التبرع', 'error');
    }
}

async function deleteVoucher(voucherId) {
    if (!confirm('هل أنت متأكد من حذف هذا الشيك؟')) return;
    
    try {
        await firebaseDB.deleteVoucher(voucherId);
        showNotification('تم حذف الشيك بنجاح', 'success');
        loadData();
    } catch (error) {
        console.error('Error deleting voucher:', error);
        showNotification('حدث خطأ في حذف الشيك', 'error');
    }
}
async function handleRedeemVoucher(e) {
    e.preventDefault();
    
    const voucherId = document.getElementById('voucherSelect').value;
    const redemptionDate = document.getElementById('redemptionDate').value;
    const beneficiaryName = document.getElementById('beneficiaryName').value.trim();
    const redemptionPurpose = document.getElementById('redemptionPurpose').value.trim();
    const redemptionNotes = document.getElementById('redemptionNotes').value.trim();
    
    if (!voucherId) {
        showNotification('يرجى اختيار الشيك المراد صرفه', 'error');
        return;
    }
    
    try {
        const vouchers = await firebaseDB.getVouchers();
        const voucher = vouchers.find(v => v.id === voucherId);
        
        if (!voucher) {
            showNotification('الشيك غير موجود', 'error');
            return;
        }
        
        if (voucher.status === 'redeemed') {
            showNotification('هذا الشيك تم صرفه بالفعل', 'error');
            return;
        }
        
        if (voucher.status === 'expired') {
            showNotification('هذا الشيك منتهي الصلاحية', 'error');
            return;
        }
        
        // تحديث حالة الشيك
        await firebaseDB.updateVoucher(voucherId, {
            status: 'redeemed',
            redemptionDate: new Date(redemptionDate),
            beneficiaryName: beneficiaryName,
            redemptionPurpose: redemptionPurpose,
            redemptionNotes: redemptionNotes
        });
        
        showNotification('تم صرف الشيك بنجاح', 'success');
        closeModal('redeemVoucherModal');
        document.getElementById('redeemVoucherForm').reset();
        document.getElementById('voucherInfo').style.display = 'none';
        loadData(); // إعادة تحميل البيانات
        
    } catch (error) {
        console.error('Error redeeming voucher:', error);
        showNotification('حدث خطأ في صرف الشيك', 'error');
    }
}
