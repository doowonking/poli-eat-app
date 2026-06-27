let count = 0;
const maxCount = 5; // 5번 먹으면 완밥!

const eatBtn = document.getElementById('eat-btn');
const poliChar = document.getElementById('poli-character');
const poliMsg = document.getElementById('poli-message');
const energyBar = document.getElementById('energy-bar');
const eatCountText = document.getElementById('eat-count');

// 브라우저 기본 알림음 효과 (사운드 파일 없을 때 대체)
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

eatBtn.addEventListener('click', () => {
    if (count >= maxCount) return;

    count++;
    eatCountText.innerText = count;
    
    // 게이지 상승
    const progress = (count / maxCount) * 100;
    energyBar.style.width = `${progress}%`;

    // 폴리 반응 효과 (이미지 교체 대신 이모지 변경 및 애니메이션)
    poliChar.innerText = "😋"; 
    poliChar.classList.add('poli-eating');
    poliMsg.innerText = "와구와구! 진짜 맛있어! 냠냠!";
    playBeep(600, 0.3); // 냠냠 소리 대용 삑-음

    // 1초 뒤 다시 대기 상태로 변경
    setTimeout(() => {
        poliChar.classList.remove('poli-eating');
        if (count < maxCount) {
            poliChar.innerText = "重新 (🚓)"; // 원래 폴리로 복귀 (실제 구현 시 이미지 교체)
            poliChar.innerText = "🚓";
            poliMsg.innerText = "한 입 더 충전해줘, 구조대원!";
        } else {
            // 5번 다 먹었을 때 (완밥 엔딩)
            poliChar.innerText = "👑";
            poliMsg.innerText = "⚡ 충전 완료! 출동 준비 끝! 고마워! ⚡";
            playBeep(800, 0.5);
            eatBtn.innerText = "🎉 완밥 축하합니다! 🎉";
            eatBtn.style.backgroundColor = "#4caf50";
            eatBtn.style.boxShadow = "0px 6px 0px #2e7d32";
        }
    }, 1000);
});
