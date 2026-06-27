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

// 💡 오디오 객체 미리 생성 (깃허브에 올릴 파일명과 일치해야 합니다)
const sndOpen = new Audio('poli_open.mp3');
const sndEat = new Audio('poli_eat.mp3');
const sndSuccess = new Audio('poli_success.mp3');

function startEatingSequence() {
    if (count >= maxCount || isCoolDown) return;
    isCoolDown = true;

    // [1단계] 아이와 동기화: 폴리도 같이 입 벌리기
    poliChar.src = "poli_open.png"; 
    poliChar.className = "poli-avatar poli-open";
    poliMsg.innerText = "아~~!!";
    sndOpen.play().catch(e => console.log("오디오 재생 재생 시점 제한 우회"));

    // 0.8초 뒤 [2단계] 와구와구 먹기 시작
    setTimeout(() => {
        count++;
        eatCountText.innerText = count;
        energyBar.style.width = `${(count / maxCount) * 100}%`;

        poliChar.src = "poli_eat.png"; 
        poliChar.className = "poli-avatar poli-chew";
        poliMsg.innerText = "와구와구! 진짜 튼튼해지겠다!";
        sndEat.play().catch(e => {});

        // 2.5초간 맛있게 먹은 후 상태 리셋
        setTimeout(() => {
            poliChar.className = "poli-avatar"; 
            
            if (count < maxCount) {
                // 💡 잔소리 메시지 삭제! 기본 대기 상태로 바로 복귀합니다.
                poliChar.src = "poli_idle.png";
                poliMsg.innerText = "같이 아~ 해보자!";
                
                // 음식을 삼킬 시간을 주기 위해 4초 쿨타임 후 다음 한 입 인식 허용
                setTimeout(() => { isCoolDown = false; }, 4000);
            } else {
                // [3단계] 5번 다 채웠을 때 완밥 엔딩!
                poliChar.src = "poli_success.png";
                poliMsg.innerText = "⚡ 완밥 미션 성공! 출동 준비 끝! ⚡";
                sndSuccess.play().catch(e => {});
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
        
        // 아이가 입을 크게 벌렸을 때
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
