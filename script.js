let count = 0;
const maxCount = 5; 
let isCoolDown = false; // 입을 계속 벌리고 있을 때 무한 인정되는 걸 방지하는 안전장치

const eatBtn = document.getElementById('eat-btn');
const poliChar = document.getElementById('poli-character');
const poliMsg = document.getElementById('poli-message');
const energyBar = document.getElementById('energy-bar');
const eatCountText = document.getElementById('eat-count');
const webcamElement = document.getElementById('webcam');
const loadingMsg = document.getElementById('loading-msg');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, duration) {
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

// 냠냠 성공 액션
function triggerEat() {
    if (count >= maxCount || isCoolDown) return;

    isCoolDown = true; // 쿨타임 작동 (아이가 우물우물 씹는 동안은 인식 멈춤)
    count++;
    eatCountText.innerText = count;
    
    const progress = (count / maxCount) * 100;
    energyBar.style.width = `${progress}%`;

    poliChar.innerText = "😋"; 
    poliChar.classList.add('poli-eating');
    poliMsg.innerText = "와구와구! 구조대원 진짜 최고다! 대단해!";
    playBeep(600, 0.3); 

    setTimeout(() => {
        poliChar.classList.remove('poli-eating');
        if (count < maxCount) {
            poliChar.innerText = "🚓";
            poliMsg.innerText = "에너지가 더 필요해! 한 입 더 아~ 해볼까?";
            // 4초 뒤에 다음 입열기 인식을 허용합니다. (아이 식사 속도에 맞게 조절 가능)
            setTimeout(() => { isCoolDown = false; }, 4000); 
        } else {
            poliChar.innerText = "👑";
            poliMsg.innerText = "⚡ 완밥 성공! 에너지가 가득 찼어! 출동!! ⚡";
            playBeep(800, 0.5);
            eatBtn.innerText = "🎉 미션 완료! 다 먹었어요! 🎉";
            eatBtn.style.backgroundColor = "#4caf50";
        }
    }, 2000);
}

// 버튼 누르는 수동 작동도 유지
eatBtn.addEventListener('click', triggerEat);

// --- AI 입벌림 감지 엔진 ---
function onResults(results) {
    if (loadingMsg) loadingMsg.style.display = "none";
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // 13번(윗입술 안쪽), 14번(아랫입술 안쪽) 좌표 획득
        const topLip = landmarks[13];
        const bottomLip = landmarks[14];
        
        // 두 입술의 Y축 거리 계산
        const mouthDistance = Math.abs(topLip.y - bottomLip.y);
        
        // 거리가 0.045보다 크면 입을 벌린 것으로 판단 (스마트폰과의 거리에 따라 미세조정 필요)
        if (mouthDistance > 0.045 && !isCoolDown) {
            triggerEat();
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
    onFrame: async () => {
        await faceMesh.send({ image: webcamElement });
    },
    width: 320,
    height: 320
});

camera.start().catch(err => {
    if (loadingMsg) loadingMsg.innerText = "카메라 권한을 승인해주세요! 🙏";
    console.error(err);
});
