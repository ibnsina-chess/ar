// تكوين Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCd9XbhKz-AYvVJtLCi2hVDBvyYsSGB89w",
    authDomain: "chess-3596b.firebaseapp.com",
    databaseURL: "https://chess-3596b-default-rtdb.firebaseio.com",
    projectId: "chess-3596b",
    storageBucket: "chess-3596b.firebasestorage.app",
    messagingSenderId: "628293480183",
    appId: "1:628293480183:web:ecd5f317c728cd1233edf2",
    measurementId: "G-11H7GE4LT7"
};

// تهيئة Firebase إذا لم تكن مهيأة بالفعل
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const database = firebase.database();

// المتغيرات العامة
let board = null;
let game = new Chess();
let currentPuzzle = null;
let currentUser = null;
let userStats = {
    solved: 0,
    points: 0
};
let puzzles = [];
let currentPuzzleIndex = 0;
let attemptsMade = 0;
let authChecked = false; // علامة لمنع عمليات إعادة التوجيه المتعددة

// عناصر DOM
const boardElement = document.getElementById('board');
const puzzleIdElement = document.getElementById('puzzle-id');
const puzzleDifficultyElement = document.getElementById('puzzle-difficulty');
const puzzleThemesElement = document.getElementById('puzzle-themes');
const puzzleInstructionElement = document.getElementById('puzzle-instruction');
const puzzleMessageElement = document.getElementById('puzzle-message');
const userAvatarElement = document.getElementById('user-avatar');
const userNameElement = document.getElementById('user-name');
const solvedCountElement = document.getElementById('solved-count');
const userPointsElement = document.getElementById('user-points');
const hintButton = document.getElementById('hint-btn');
const solutionButton = document.getElementById('solution-btn');
const nextButton = document.getElementById('next-btn');
const logoutButton = document.getElementById('logout-btn');

// فحص حالة المصادقة
auth.onAuthStateChanged(user => {
    if (authChecked) return; // منع التنفيذ المتعدد
    authChecked = true;
    
    if (user) {
        currentUser = user;
        console.log("تم مصادقة المستخدم:", user.email);
        
        // الحصول على معرف المستخدم من تخزين الجلسة
        const memberId = sessionStorage.getItem("memberId");
        
        if (memberId) {
            console.log("تم العثور على معرف العضو في الجلسة:", memberId);
            fetchUserData(memberId)
                .then(() => {
                    loadPuzzles();
                })
                .catch(error => {
                    console.error("خطأ في fetchUserData:", error);
                    // عرض رسالة خطأ بدلاً من إعادة التوجيه
                    showMessage("خطأ في تحميل بيانات المستخدم. يرجى تحديث الصفحة.", "error");
                });
        } else {
            console.log("لا يوجد معرف عضو في الجلسة، محاولة البحث بالبريد الإلكتروني");
            // محاولة الحصول على بيانات المستخدم من البريد الإلكتروني
            const emailParts = user.email.split('@');
            if (emailParts.length > 1 && emailParts[1].includes("ibnsinachess")) {
                const name = emailParts[0];
                console.log("البحث عن مستخدم بالبريد الإلكتروني:", user.email);
                
                // استعلام قاعدة البيانات للعثور على المستخدم بهذا البريد الإلكتروني
                database.ref('users').orderByChild('email').equalTo(user.email).once('value')
                    .then((snapshot) => {
                        if (snapshot.exists()) {
                            const userData = snapshot.val();
                            const userId = Object.keys(userData)[0];
                            console.log("تم العثور على معرف المستخدم:", userId);
                            
                            sessionStorage.setItem("memberId", userId);
                            return fetchUserData(userId);
                        } else {
                            console.log("لم يتم العثور على مستخدم بالبريد الإلكتروني:", user.email);
                            // إنشاء بيانات مستخدم مؤقتة بدلاً من إعادة التوجيه
                            const tempId = "temp-" + name;
                            sessionStorage.setItem("memberId", tempId);
                            
                            // تعيين معلومات المستخدم الأساسية
                            userNameElement.textContent = name;
                            const initials = name.charAt(0).toUpperCase();
                            userAvatarElement.textContent = initials;
                            
                            // تهيئة الإحصائيات
                            userStats = {
                                solved: 0,
                                points: 0,
                                lastPuzzle: null
                            };
                            
                            updateUserStats();
                            return Promise.resolve();
                        }
                    })
                    .then(() => {
                        loadPuzzles();
                    })
                    .catch(error => {
                        console.error("خطأ في العثور على المستخدم:", error);
                        // عرض رسالة خطأ بدلاً من إعادة التوجيه
                        showMessage("خطأ في تحميل بيانات المستخدم. يرجى تحديث الصفحة.", "error");
                    });
            } else {
                console.log("تنسيق بريد إلكتروني غير صالح:", user.email);
                // إنشاء مستخدم عام بدلاً من إعادة التوجيه
                createGenericUser(user);
                loadPuzzles();
            }
        }
    } else {
        console.log("لا يوجد مستخدم مصادق عليه، إعادة التوجيه إلى صفحة المصادقة");
        redirectToAuth();
    }
});

// إنشاء مستخدم عام عندما لا يتم العثور على معرف عضو
function createGenericUser(user) {
    const name = user.email ? user.email.split('@')[0] : "زائر";
    userNameElement.textContent = name;
    const initials = name.charAt(0).toUpperCase();
    userAvatarElement.textContent = initials;
    
    userStats = {
        solved: 0,
        points: 0,
        lastPuzzle: null
    };
    
    updateUserStats();
}

// جلب بيانات المستخدم من قاعدة البيانات
function fetchUserData(memberId) {
    return new Promise((resolve, reject) => {
        console.log(`جلب بيانات المستخدم للمعرف: ${memberId}`);
        
        database.ref(`users/${memberId}`).once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    console.log("تم العثور على بيانات المستخدم:", userData);
                    
                    // تحديث ملف المستخدم
                    const nameParts = memberId.split('-');
                    const name = nameParts.slice(1).join('-');
                    userNameElement.textContent = name || memberId;
                    
                    // تعيين الصورة الرمزية بالأحرف الأولى
                    const initials = name 
                        ? name.split('-')
                            .map(part => part.charAt(0).toUpperCase())
                            .join('')
                        : memberId.charAt(0).toUpperCase();
                    
                    userAvatarElement.textContent = initials;
                    
                    // الحصول على إحصائيات المستخدم
                    return database.ref(`users/${memberId}/stats`).once('value');
                } else {
                    console.log("لم يتم العثور على بيانات المستخدم للمعرف:", memberId);
                    // تهيئة المعلومات الأساسية إذا لم تكن البيانات موجودة
                    userNameElement.textContent = memberId;
                    userAvatarElement.textContent = memberId.charAt(0).toUpperCase();
                    
                    // تهيئة الإحصائيات
                    userStats = {
                        solved: 0,
                        points: 0,
                        lastPuzzle: null
                    };
                    
                    return database.ref(`users/${memberId}/stats`).set(userStats)
                        .then(() => {
                            return database.ref(`users/${memberId}/stats`).once('value');
                        });
                }
            })
            .then((statsSnapshot) => {
                if (statsSnapshot.exists()) {
                    userStats = statsSnapshot.val();
                    console.log("إحصائيات المستخدم:", userStats);
                }
                
                // تحديث واجهة المستخدم بالإحصائيات
                updateUserStats();
                resolve();
            })
            .catch(error => {
                console.error("خطأ في fetchUserData:", error);
                reject(error);
            });
    });
}

// تحديث إحصائيات المستخدم في واجهة المستخدم
function updateUserStats() {
    solvedCountElement.textContent = userStats.solved || 0;
    userPointsElement.textContent = userStats.points || 0;
}

// تحميل الألغاز من قاعدة البيانات
function loadPuzzles() {
    console.log("تحميل الألغاز");
    
    database.ref('puzzles').once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const puzzlesData = snapshot.val();
                puzzles = Object.values(puzzlesData);
                console.log(`تم تحميل ${puzzles.length} لغزًا`);
                
                // خلط الألغاز
                shuffleArray(puzzles);
                
                // إذا كان للمستخدم لغز أخير، حاول البدء من هناك
                if (userStats.lastPuzzle) {
                    const lastPuzzleIndex = puzzles.findIndex(p => p.id === userStats.lastPuzzle);
                    if (lastPuzzleIndex !== -1) {
                        currentPuzzleIndex = lastPuzzleIndex + 1;
                        if (currentPuzzleIndex >= puzzles.length) {
                            currentPuzzleIndex = 0; // العودة إلى البداية
                        }
                    }
                }
                
                // تحميل اللغز الأول
                loadPuzzle(currentPuzzleIndex);
            } else {
                console.error("لم يتم العثور على ألغاز");
                showMessage("لا توجد ألغاز متاحة. يرجى المحاولة مرة أخرى لاحقًا.", "error");
            }
        })
        .catch(error => {
            console.error("خطأ في تحميل الألغاز:", error);
            showMessage("خطأ في تحميل الألغاز. يرجى المحاولة مرة أخرى لاحقًا.", "error");
        });
}

// تحميل اللغز بالفهرس المعطى
function loadPuzzle(index) {
    if (!puzzles.length) {
        console.error("لا توجد ألغاز متاحة للتحميل");
        showMessage("لا توجد ألغاز متاحة. يرجى المحاولة مرة أخرى لاحقًا.", "error");
        return;
    }
    
    if (index >= puzzles.length) {
        index = 0; // العودة إلى البداية
    }
    
    currentPuzzleIndex = index;
    currentPuzzle = puzzles[index];
    attemptsMade = 0;
    
    console.log("تحميل اللغز:", currentPuzzle.id);
    
    // تحديث واجهة المستخدم بمعلومات اللغز
    if (puzzleIdElement) puzzleIdElement.textContent = currentPuzzle.id.replace('puzzle_', '');
    if (puzzleDifficultyElement) puzzleDifficultyElement.textContent = currentPuzzle.difficulty.charAt(0).toUpperCase() + currentPuzzle.difficulty.slice(1);
    if (puzzleThemesElement) puzzleThemesElement.textContent = currentPuzzle.themes.map(theme => theme.charAt(0).toUpperCase() + theme.slice(1)).join(', ');
    
    // تعيين التعليمات بناءً على دور من يلعب
    const turn = currentPuzzle.turn === 'w' ? 'الأبيض' : 'الأسود';
    if (puzzleInstructionElement) puzzleInstructionElement.textContent = `ابحث عن أفضل نقلة لـ ${turn}.`;
    
    // تحميل الوضع
    game = new Chess(currentPuzzle.fen);
    
    // مسح أي رسائل سابقة
    hideMessage();
    
    // تهيئة اللوحة
    try {
        initializeBoard();
        
        // حفظ آخر لغز للمستخدم
        const memberId = sessionStorage.getItem("memberId");
        if (memberId) {
            database.ref(`users/${memberId}/stats/lastPuzzle`).set(currentPuzzle.id);
        }
    } catch (error) {
        console.error("خطأ في تهيئة اللوحة:", error);
        showMessage("خطأ في تحميل اللغز. يرجى تحديث الصفحة.", "error");
    }
}

// تهيئة لوحة الشطرنج
function initializeBoard() {
    // تدمير اللوحة السابقة إذا كانت موجودة
    if (board) {
        board.destroy();
    }
    
    // تعيين الاتجاه بناءً على الدور
    const orientation = currentPuzzle.turn === 'w' ? 'white' : 'black';
    
    // إنشاء لوحة جديدة
    const config = {
        draggable: true,
        position: game.fen(),
        orientation: orientation,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    
    board = Chessboard('board', config);
    
    // تغيير حجم اللوحة لتناسب الحاوية
    $(window).resize(() => {
        board.resize();
    });
}

// معالجة حدث بدء السحب
function onDragStart(source, piece, position, orientation) {
    // السماح فقط للاعب الذي دوره باللعب
    if (game.turn() !== currentPuzzle.turn) {
        return false;
    }
    
    // السماح فقط بتحريك القطع ذات اللون الصحيح
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
    
    // عدم السماح بالتحريك إذا انتهت اللعبة
    if (game.game_over()) {
        return false;
    }
    
    return true;
}

// معالجة حدث الإفلات
function onDrop(source, target) {
    // معرفة إذا كانت النقلة قانونية
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // الترقية دائمًا إلى وزير للتبسيط
    });
    
    // إذا كانت النقلة غير قانونية، إعادة القطعة
    if (move === null) {
        return 'snapback';
    }
    
    // التحقق مما إذا كانت النقلة تطابق الحل
    checkSolution(move);
}

// معالجة حدث نهاية التثبيت
function onSnapEnd() {
    board.position(game.fen());
}

// التحقق مما إذا كانت النقلة تطابق الحل
function checkSolution(move) {
    const moveNotation = convertMoveToNotation(move);
    
    // التحقق مما إذا كانت هذه النقلة في الحل
    if (currentPuzzle.solution.includes(moveNotation)) {
        // نقلة صحيحة
        showMessage("صحيح! أحسنت!", "success");
        
        // تحديث إحصائيات المستخدم
        updateUserStatsAfterSolve();
        
        // تعطيل اللوحة
        board.draggable = false;
    } else {
        // نقلة خاطئة
        attemptsMade++;
        
        if (attemptsMade >= 3) {
            // بعد 3 محاولات فاشلة، عرض تلميح
            showMessage("غير صحيح. حاول مرة أخرى. تلميح: " + getHint(), "hint");
        } else {
            showMessage("غير صحيح. حاول مرة أخرى.", "error");
            
            // إعادة تعيين الوضع الأصلي
            game = new Chess(currentPuzzle.fen);
            board.position(game.fen());
        }
    }
}

// تحويل كائن النقلة إلى تدوين
function convertMoveToNotation(move) {
    // معالجة الحالات الخاصة
    if (move.flags.includes('k') || move.flags.includes('q')) {
        // التبييت
        return move.flags.includes('k') ? 'O-O' : 'O-O-O';
    }
    
    let notation = '';
    
    // إضافة حرف القطعة لغير البيادق
    if (move.piece !== 'p') {
        notation += move.piece.toUpperCase();
    }
    // إضافة مربع المصدر إذا لزم الأمر (للتمييز)
    if (move.flags.includes('c') || move.flags.includes('e')) {
        // الأسر أو الأخذ بالمرور
        if (move.piece === 'p') {
            notation += move.from[0];
        }
    }

    // إضافة رمز الأسر
    if (move.flags.includes('c') || move.flags.includes('e')) {
        notation += 'x';
    }

    // إضافة مربع الوجهة
    notation += move.to;

    // إضافة قطعة الترقية
    if (move.flags.includes('p')) {
        notation += '=' + move.promotion.toUpperCase();
    }

    // إضافة رمز الشاه أو الكش مات
    if (move.flags.includes('n') || move.flags.includes('b')) {
        notation += '#';
    } else if (move.flags.includes('c') || move.flags.includes('e')) {
        notation += '+';
    }

    return notation;
}

// الحصول على تلميح للغز الحالي
function getHint() {
    const solution = currentPuzzle.solution[0];

    // استخراج مربع الوجهة
    let destination = solution.match(/([a-h][1-8])/);
    if (destination) {
        return `ابحث عن نقلة إلى ${destination[0]}`;
    }

    // بديل إذا فشلت مطابقة النمط
    return "ابحث عن كش مات أو نقلة تكتيكية";
}

// تحديث إحصائيات المستخدم بعد حل اللغز
function updateUserStatsAfterSolve() {
    const memberId = sessionStorage.getItem("memberId");
    if (!memberId) return;

    // حساب النقاط بناءً على الصعوبة والمحاولات
    let points = 0;
    switch (currentPuzzle.difficulty) {
        case 'easy':
            points = 5;
            break;
        case 'medium':
            points = 10;
            break;
        case 'hard':
            points = 15;
            break;
        case 'expert':
            points = 20;
            break;
    }

    // تقليل النقاط للمحاولات المتعددة
    points = Math.max(1, points - (attemptsMade * 2));

    // تحديث إحصائيات المستخدم
    userStats.solved = (userStats.solved || 0) + 1;
    userStats.points = (userStats.points || 0) + points;

    // الحفظ في قاعدة البيانات
    database.ref(`users/${memberId}/stats`).update({
        solved: userStats.solved,
        points: userStats.points
    });

    // الإضافة إلى الألغاز المحلولة
    database.ref(`users/${memberId}/solved/${currentPuzzle.id}`).set({
        timestamp: Date.now(),
        points: points,
        attempts: attemptsMade + 1
    });

    // تحديث واجهة المستخدم
    updateUserStats();
}

// عرض رسالة
function showMessage(message, type) {
    if (!puzzleMessageElement) return;

    puzzleMessageElement.textContent = message;
    puzzleMessageElement.className = 'puzzle-message';
    puzzleMessageElement.classList.add(`puzzle-${type}`);
    puzzleMessageElement.style.display = 'block';
}

// إخفاء رسالة
function hideMessage() {
    if (!puzzleMessageElement) return;
    puzzleMessageElement.style.display = 'none';
}

// خلط المصفوفة
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// إعادة التوجيه إلى صفحة المصادقة
function redirectToAuth() {
    console.log("إعادة التوجيه إلى صفحة المصادقة");
    window.location.href = "auth.html";
}

// مستمعو الأحداث
document.addEventListener('DOMContentLoaded', () => {
    console.log("تم تحميل محتوى DOM");

    // زر التلميح
    if (hintButton) {
        hintButton.addEventListener('click', () => {
            showMessage("تلميح: " + getHint(), "hint");
        });
    }

    // زر الحل
    if (solutionButton) {
        solutionButton.addEventListener('click', () => {
            showMessage("الحل: " + currentPuzzle.solution.join(' أو '), "hint");
        });
    }

    // زر التالي
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            loadPuzzle(currentPuzzleIndex + 1);
        });
    }

    // زر تسجيل الخروج
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                sessionStorage.removeItem("memberId");
                redirectToAuth();
            }).catch((error) => {
                console.error("خطأ في تسجيل الخروج:", error);
            });
        });
    }

    // تبديل علامات التبويب
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // إزالة الفئة النشطة من جميع علامات التبويب والمحتوى
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // إضافة الفئة النشطة إلى علامة التبويب المنقورة
            tab.classList.add('active');
            
            // إظهار المحتوى المقابل
            const tabId = tab.getAttribute('data-tab');
            const contentTab = document.getElementById(`${tabId}-tab`);
            if (contentTab) {
                contentTab.classList.add('active');
            }
            
            // إذا كانت علامة تبويب لوحة المتصدرين، قم بتحديث لوحة المتصدرين
            if (tabId === 'leaderboard') {
                if (typeof loadLeaderboard === 'function') {
                    loadLeaderboard();
                }
            }
        });
    });
});

// دالة لتحديث لوحة المتصدرين من leaderboard.js
function refreshLeaderboard() {
    if (typeof loadLeaderboard === 'function') {
        loadLeaderboard();
    } else {
        console.warn("دالة لوحة المتصدرين غير متاحة");
    }
}