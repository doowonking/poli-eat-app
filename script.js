let count = 0;
const maxCount = 5; 
let isCoolDown = false; 

const eatBtn = document.getElementById('eat-btn');
const poliChar = document.getElementById('poli-character');
const poliMsg = document.getElementById('poli-message');
const energyBar = document.getElementById('energy-bar');
const eatCountText = document.getElementById('eat-count');
const webcamElement = document.getElementById('webcam');
const loadingMsg = document.getElementById('loading-msg');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
}

// 아이가 입을 벌리면 폴리도 같이 반응하는 로직
function startEatingSequence() {
    if (count >= maxCount || isCoolDown) return;
    isCoolDown = true;

    // [1단계] 동기화: 폴리도 같이 입을 벌림!
    poliChar.innerText = "😮"; // 입 벌린 폴리 대용 이모지
    poliChar.className = "poli-avatar poli-open";
    poliMsg.innerText = "아~! 폴리도 같이 아~~!!";
    playSound(440, 0.1);

    // 0.8초 뒤 [2단계] 우물우물 먹기 시작
    setTimeout(() => {
        count++;
        eatCountText.innerText = count;
        energyBar.style.width = `${(count / maxCount) * 100}%`;

        poliChar.innerText = "😋"; // 냠냠 이모지
        poliChar.className = "poli-avatar poli-chew";
        poliMsg.innerText = "와구와구! 냠냠! 너무 맛있다!";
        playSound(600, 0.4);

        // 2.5초 동안 맛있게 먹은 후 [3단계] 대기 또는 엔딩
        setTimeout(() => {
            poliChar.className = "poli-avatar"; // 애니메이션 제거
            
            if (count < maxCount) {
                poliChar.innerText = " Louie ( Patrol Car ) 🚓"; 
                poliChar.innerText = "🚓"; // 평소 폴리로 복귀
                poliMsg.innerText = "다음 한 입도 같이 먹자, 대원!";
                
                // 아이가 음식을 완전히 씹고 삼킬 시간을 주기 위해 4초 쿨타임 후 다음 인식 허용
                setTimeout(() => { isCoolDown = false; }, 4000);
            } else {
                // 완밥 성공!
                poliChar.innerText = "👑";
                poliMsg.innerText = "⚡ 완밥 미션 성공! 출동 준비 끝! ⚡";
                playSound(800, 0.6);
            }
        }, 2500);

    }, 800);
}

eatBtn.addEventListener('click', startEatingSequence);

// --- AI 실시간 입 벌림 체크 로직 ---
function onResults(results) {
    if (loadingMsg) loadingMsg.style.display = "none";
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        const topLip = landmarks[13];
        const bottomLip = landmarks[14];
        const mouthDistance = Math.abs(topLip.y - bottomLip.y);
        
        // 아이가 입을 크게 벌렸을 때 (쿨다운 상태가 아닐 때만)
        if (mouthDistance > 0.048 && !isCoolDown) {
            startEatingSequence();
        }
    }
}

const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

const camera = new Camera(webcamElement, {
    onFrame: async () => { await faceMesh.send({ image: webcamElement }); },
    width: 640,
    height: 480
});
camera.start().catch(err => {
    if (loadingMsg) loadingMsg.innerText = "카메라 권한을 허용해주세요! 🙏";
});
