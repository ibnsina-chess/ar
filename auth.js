// إعدادات Firebase
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

// تهيئة Firebase مع معالجة الأخطاء
try {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();
    console.log("تم تهيئة Firebase بنجاح");
    initAuth(auth, database);
} catch (error) {
    console.error("خطأ في تهيئة Firebase:", error);
    document.getElementById("error-message").textContent = "خطأ في تهيئة المصادقة. يرجى المحاولة مرة أخرى لاحقًا.";
    document.getElementById("error-message").style.display = "block";
}

// تهيئة المصادقة بعد إعداد Firebase
function initAuth(auth, database) {
    // التحقق مما إذا كان المستخدم قد سجل دخوله بالفعل
    auth.onAuthStateChanged(user => {
        if (user) {
            // المستخدم مسجل دخوله بالفعل، إعادة التوجيه إلى صفحة الألغاز
            window.location.href = "puzzles.html";
        }
    });
    
    // عناصر DOM
    const scanStep = document.getElementById("scan-step");
    const loginStep = document.getElementById("login-step");
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");
    const manualToggle = document.getElementById("manual-toggle");
    const manualIdInput = document.getElementById("manual-id-input");
    const manualSubmit = document.getElementById("manual-submit");
    const startScanButton = document.getElementById("start-scan-button");
    
    // التأكد من وجود هذه العناصر
    if (!manualIdInput || !manualSubmit) {
        console.error("عناصر الإدخال اليدوي غير موجودة");
        if (errorMessage) {
            errorMessage.textContent = "حدثت مشكلة في النموذج. يرجى تحديث الصفحة.";
            errorMessage.style.display = "block";
        }
        return;
    }
    
    // إعداد ماسح رمز QR من HTML5
    let html5QrCode;
    let isScanning = false;
    
    // وظيفة بدء مسح رمز QR
    function startScanner() {
        if (!document.getElementById("qr-reader")) {
            console.error("عنصر قارئ QR غير موجود");
            return;
        }
        
        html5QrCode = new Html5Qrcode("qr-reader");
        const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        html5QrCode.start(
            { facingMode: "environment" },
            qrConfig,
            onScanSuccess,
            onScanFailure
        ).then(() => {
            isScanning = true;
            if (startScanButton) {
                startScanButton.textContent = "إلغاء المسح";
                startScanButton.classList.add("scanning");
            }
        }).catch(error => {
            console.error("خطأ في بدء ماسح QR:", error);
            showError("لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات أو استخدام الإدخال اليدوي.");
        });
    }
    
    // وظيفة إيقاف مسح رمز QR
    function stopScanner() {
        if (html5QrCode && isScanning) {
            html5QrCode.stop().then(() => {
                isScanning = false;
                if (startScanButton) {
                    startScanButton.textContent = "بدء ماسح رمز QR";
                    startScanButton.classList.remove("scanning");
                }
            }).catch(error => {
                console.error("خطأ في إيقاف ماسح QR:", error);
            });
        }
    }
    
    // تبديل حالة الماسح عند النقر على زر البدء
    if (startScanButton) {
        startScanButton.addEventListener("click", () => {
            if (!isScanning) {
                startScanner();
            } else {
                stopScanner();
            }
        });
    }
    
    // وظيفة معالجة المسح الناجح لرمز QR
    function onScanSuccess(decodedText) {
        console.log("تم مسح رمز QR:", decodedText);
        // التحقق مما إذا كان رمز QR يحتوي على عنوان URL صالح للعضوية
        if (decodedText.includes("member.html?id=")) {
            // استخراج معرف العضو من عنوان URL
            const memberIdMatch = decodedText.match(/id=([^&]+)/);
            if (memberIdMatch && memberIdMatch[1]) {
                const memberId = memberIdMatch[1];
                // إيقاف المسح
                stopScanner();
                // معالجة معرف العضو
                processMemberId(memberId);
            } else {
                showError("تنسيق رمز QR غير صالح");
            }
        } else if (decodedText.match(/^\d{1,4}-[a-zA-Z]+-[a-zA-Z]+$/)) {
            // تنسيق معرف العضو المباشر
            stopScanner();
            processMemberId(decodedText);
        } else {
            showError("رمز QR غير صالح. يرجى مسح بطاقة العضوية الخاصة بك.");
        }
    }
    
    // وظيفة معالجة فشل المسح
    function onScanFailure(error) {
        // معالجة فشل المسح بصمت
        console.warn(`خطأ في مسح رمز QR: ${error}`);
    }
    
    // وظيفة معالجة معرف العضو (من رمز QR أو الإدخال اليدوي)
    function processMemberId(memberId) {
        console.log("معالجة معرف العضو:", memberId);
        // تحقق أكثر مرونة لتنسيق معرف العضوية
        // قبول تنسيقات مثل 0001-firstname-lastname أو متغيراتها
        const idRegex = /^(\d{1,4})-([a-zA-Z]+)(-[a-zA-Z]+)?$/;
        const idMatch = memberId.match(idRegex);
        
        if (!idMatch) {
            showError("تنسيق معرف العضوية غير صالح. التنسيق المتوقع: 0001-firstname-lastname");
            return;
        }
        
        // استخراج الاسم من المعرف - التعامل مع الحالات مع وبدون اسم العائلة
        let name;
        if (idMatch[3]) {
            // يحتوي على اسم العائلة
            name = idMatch[2] + idMatch[3];
        } else {
            // الاسم الأول فقط
            name = idMatch[2];
        }
        
        // تعيين البريد الإلكتروني وكلمة المرور
        const email = `${name.toLowerCase()}@ibnsinachess.com`;
        const password = memberId;
        
        console.log("البريد الإلكتروني المُنشأ:", email);
        console.log("كلمة المرور المُنشأة:", password);
        
        // ملء نموذج تسجيل الدخول مسبقًا
        emailInput.value = email;
        passwordInput.value = password;
        
        // إظهار خطوة تسجيل الدخول
        scanStep.style.display = "none";
        loginStep.style.display = "block";
        loginForm.style.display = "flex";
        
        // تخزين معرف العضو في تخزين الجلسة
        sessionStorage.setItem("memberId", memberId);
    }
    
    // إرسال نموذج تسجيل الدخول
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        try {
            // إظهار حالة التحميل
            const submitButton = loginForm.querySelector("button");
            submitButton.disabled = true;
            submitButton.textContent = "جاري تسجيل الدخول...";
            
            // تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // الحصول على معرف العضو من تخزين الجلسة
            const memberId = sessionStorage.getItem("memberId");
            
            if (memberId) {
                // تحديث بيانات المستخدم في قاعدة البيانات الفورية
                await database.ref(`users/${memberId}`).set({
                    email: email,
                    lastLogin: new Date().toISOString(),
                    uid: user.uid
                });
                
                // إظهار رسالة نجاح
                showSuccess("تم تسجيل الدخول بنجاح! جاري التحويل إلى صفحة الألغاز...");
                
                // إعادة التوجيه إلى صفحة الألغاز
                setTimeout(() => {
                    window.location.href = "puzzles.html";
                }, 1500);
            } else {
                showError("لم يتم العثور على معرف العضوية. يرجى مسح رمز QR الخاص بك مرة أخرى.");
                submitButton.disabled = false;
                submitButton.textContent = "تسجيل الدخول";
            }
        } catch (error) {
            console.error("خطأ في المصادقة:", error);
            
            // معالجة حالات الخطأ المختلفة
            if (error.code === "auth/user-not-found") {
                // إنشاء مستخدم جديد إذا لم يكن موجودًا
                try {
                    await auth.createUserWithEmailAndPassword(email, password);
                    showSuccess("تم إنشاء الحساب! جاري تسجيل الدخول...");
                    
                    // الحصول على معرف العضو من تخزين الجلسة
                    const memberId = sessionStorage.getItem("memberId");
                    
                    if (memberId) {
                        // تحديث بيانات المستخدم في قاعدة البيانات الفورية
                        await database.ref(`users/${memberId}`).set({
                            email: email,
                            lastLogin: new Date().toISOString(),
                            uid: auth.currentUser.uid
                        });
                        
                        // إعادة التوجيه إلى صفحة الألغاز
                        setTimeout(() => {
                            window.location.href = "puzzles.html";
                        }, 1500);
                    }
                } catch (createError) {
                    showError(`خطأ في إنشاء الحساب: ${createError.message}`);
                }
            } else {
                showError(`خطأ في المصادقة: ${error.message}`);
            }
            
            // إعادة تعيين حالة الزر
            const submitButton = loginForm.querySelector("button");
            submitButton.disabled = false;
            submitButton.textContent = "تسجيل الدخول";
        }
    });
    
    // تبديل إدخال المعرف اليدوي
    manualToggle.addEventListener("click", function() {
        console.log("تم النقر على التبديل اليدوي");
        
        if (manualIdInput.style.display === "none" || manualIdInput.style.display === "") {
            manualIdInput.style.display = "block";
            manualSubmit.style.display = "inline-block";
            manualToggle.textContent = "إلغاء الإدخال اليدوي";
            
            // إيقاف الماسح إذا كان قيد التشغيل
            stopScanner();
        } else {
            manualIdInput.style.display = "none";
            manualSubmit.style.display = "none";
            manualToggle.textContent = "إدخال المعرف يدويًا";
        }
    });
    
    // إرسال المعرف اليدوي - تم الإصلاح
    manualSubmit.addEventListener("click", function() {
        console.log("تم النقر على الإرسال اليدوي");
        const memberId = manualIdInput.value.trim();
        console.log("معرف العضو المُدخل:", memberId);
        
        if (memberId) {
            processMemberId(memberId);
        } else {
            showError("يرجى إدخال معرف العضوية الخاص بك");
        }
    });
    
    // إضافة تصحيح للضغط على مفتاح الإدخال اليدوي
    manualIdInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            console.log("تم الضغط على مفتاح الإدخال في حقل الإدخال اليدوي");
            manualSubmit.click();
        }
    });
    
    // إظهار رسالة خطأ
    function showError(message) {
        console.log("خطأ:", message);
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
    }
    
    // إظهار رسالة نجاح
    function showSuccess(message) {
        console.log("نجاح:", message);
        successMessage.textContent = message;
        successMessage.style.display = "block";
        errorMessage.style.display = "none";
    }
}