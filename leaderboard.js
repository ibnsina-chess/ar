// وظائف إدارة لوحة المتصدرين

// عناصر DOM
const leaderboardBody = document.getElementById('leaderboard-body');

// تحميل بيانات لوحة المتصدرين
function loadLeaderboard() {
    // مسح لوحة المتصدرين الحالية
    leaderboardBody.innerHTML = '';
    
    // إظهار حالة التحميل
    const loadingRow = document.createElement('tr');
    loadingRow.innerHTML = `
        <td colspan="4" style="text-align: center;">جاري تحميل بيانات لوحة المتصدرين...</td>
    `;
    leaderboardBody.appendChild(loadingRow);
    
    // جلب بيانات جميع المستخدمين مع إحصائياتهم
    database.ref('users').once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const users = snapshot.val();
                const leaderboardData = [];
                
                // معالجة بيانات المستخدمين
                Object.entries(users).forEach(([userId, userData]) => {
                    if (userData.stats && userData.stats.points) {
                        const nameParts = userId.split('-');
                        const name = nameParts.slice(1).join('-');
                        
                        leaderboardData.push({
                            id: userId,
                            name: name,
                            solved: userData.stats.solved || 0,
                            points: userData.stats.points || 0
                        });
                    }
                });
                
                // الترتيب حسب النقاط (تنازلياً)
                leaderboardData.sort((a, b) => b.points - a.points);
                
                // مسح حالة التحميل
                leaderboardBody.innerHTML = '';
                
                // ملء لوحة المتصدرين
                leaderboardData.forEach((user, index) => {
                    const rank = index + 1;
                    const row = document.createElement('tr');
                    
                    // إضافة أيقونة المركز حسب الموقع
                    let rankIcon = '';
                    if (rank === 1) {
                        rankIcon = '<i class="fas fa-trophy gold rank-icon"></i>';
                    } else if (rank === 2) {
                        rankIcon = '<i class="fas fa-medal silver rank-icon"></i>';
                    } else if (rank === 3) {
                        rankIcon = '<i class="fas fa-medal bronze rank-icon"></i>';
                    }
                    
                    row.innerHTML = `
                        <td>${rankIcon}${rank}</td>
                        <td>${user.name}</td>
                        <td>${user.solved}</td>
                        <td>${user.points}</td>
                    `;
                    
                    // تمييز المستخدم الحالي
                    const memberId = sessionStorage.getItem("memberId");
                    if (user.id === memberId) {
                        row.style.fontWeight = 'bold';
                        row.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                    }
                    
                    leaderboardBody.appendChild(row);
                });
                
                // التعامل مع لوحة المتصدرين الفارغة
                if (leaderboardData.length === 0) {
                    const emptyRow = document.createElement('tr');
                    emptyRow.innerHTML = `
                        <td colspan="4" style="text-align: center;">لا توجد بيانات في لوحة المتصدرين حتى الآن.</td>
                    `;
                    leaderboardBody.appendChild(emptyRow);
                }
            } else {
                // لم يتم العثور على مستخدمين
                leaderboardBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center;">لا توجد بيانات في لوحة المتصدرين حتى الآن.</td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error("خطأ في تحميل لوحة المتصدرين:", error);
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: red;">خطأ في تحميل بيانات لوحة المتصدرين.</td>
                </tr>
            `;
        });
}

// حساب مرتبة المستخدم
function getUserRank(userId) {
    return new Promise((resolve, reject) => {
        database.ref('users').once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const users = snapshot.val();
                    const leaderboardData = [];
                    
                    // معالجة بيانات المستخدمين
                    Object.entries(users).forEach(([id, userData]) => {
                        if (userData.stats && userData.stats.points) {
                            leaderboardData.push({
                                id: id,
                                points: userData.stats.points || 0
                            });
                        }
                    });
                    
                    // الترتيب حسب النقاط (تنازلياً)
                    leaderboardData.sort((a, b) => b.points - a.points);
                    
                    // البحث عن مرتبة المستخدم
                    const userIndex = leaderboardData.findIndex(user => user.id === userId);
                    if (userIndex !== -1) {
                        resolve(userIndex + 1);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            })
            .catch(error => {
                console.error("خطأ في الحصول على مرتبة المستخدم:", error);
                reject(error);
            });
    });
}

// تهيئة لوحة المتصدرين
document.addEventListener('DOMContentLoaded', () => {
    // سيحدث التحميل الأولي عند النقر على التبويب
});