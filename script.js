/**
 * 마이 퍼스널 쉐이드: 자동 스테이지 & 플라워 샤워 이펙트 업데이트
 */

const GameEngine = {
    config: {
        currentStage: 1, // 현재 스테이지
        target: "",
        answers: [],
        traps: [],
        currentMixed: [],
        isDone: false,
        mistakes: 0,
        maxMistakes: 3,
        requiredCount: 2,
        
        // 🌸 뷰티 컬러 풀 (절대 똥색이 안 나오는 화장품 전용 예쁜 색상들 모음)
      // 🌸 뷰티 컬러 풀 (하늘 아래 같은 핑크는 없다! 그룹당 8개의 미세 톤 차이)
        colorGroups: [
            ["#FFE4E1", "#FFB6C1", "#FFC0CB", "#FF69B4", "#FF1493", "#DB7093", "#C71585", "#F8BBD0"], // 1. 핑크 계열 (라이트~딥)
            ["#FFA07A", "#FA8072", "#E9967A", "#F08080", "#CD5C5C", "#FF7F50", "#FF6347", "#FF8C00"], // 2. 코랄/살몬 계열
            ["#DC143C", "#FF0000", "#B22222", "#8B0000", "#990000", "#A52A2A", "#CC0000", "#800000"], // 3. 레드 계열
            ["#E6E6FA", "#DDA0DD", "#DA70D6", "#BA55D3", "#9370DB", "#8A2BE2", "#9400D3", "#800080"]  // 4. 퍼플/플럼 계열
        ]    },

    elements: {
        canvas: document.getElementById('lip-canvas'),
        ctx: document.getElementById('lip-canvas').getContext('2d'),
        frame: document.getElementById('main-frame'),
        palette: document.getElementById('palette'),
        successUI: document.getElementById('success-ui'),
        flowerContainer: document.getElementById('flower-container')
    },

    init() {
        this.resize();
        this.bindEvents();
        this.generateStage(); // 게임 시작 시 1스테이지 자동 생성
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.elements.canvas.width = this.elements.canvas.parentElement.offsetWidth;
        this.elements.canvas.height = this.elements.canvas.parentElement.offsetHeight;
    },

    // 🌸 무한 스테이지 생성 알고리즘
    // 🌸 지능형 스테이지 생성 알고리즘
    // 🌸 기획자님표 4단계 난이도 밸런스 알고리즘
    generateStage() {
        let reqCount = 2;
        let trapCount = 2;

        // 🎯 난이도별 칩 개수 세팅
        if (this.config.currentStage <= 10) {
            reqCount = 2; trapCount = 2; // Level 1 (총 4개)
        } else if (this.config.currentStage <= 20) {
            reqCount = 2; trapCount = 4; // Level 2 (총 6개)
        } else if (this.config.currentStage <= 30) {
            reqCount = 3; trapCount = 3; // Level 3 (총 6개)
        } else {
            reqCount = 3; trapCount = 5; // Level 4 (총 8개 - 하드코어)
        }

        this.config.requiredCount = reqCount;
        this.config.currentMixed = [];
        this.config.mistakes = 0;
        this.config.isDone = false;

        document.getElementById('req-count-text').innerText = `${reqCount} colors`;
        document.getElementById('stage-ui').innerText = `STAGE ${this.config.currentStage}`;

        // 🎨 난이도에 따른 '지능형 색상 추출'
        let groups = [...this.config.colorGroups].sort(() => 0.5 - Math.random());
        let mainGroup = [...groups[0]].sort(() => 0.5 - Math.random()); // 타겟 색상이 될 메인 그룹

        if (this.config.currentStage <= 10) {
            // 🥉 Level 1 (1~10): 정답과 확연히 다른 함정! (튜토리얼)
            this.config.answers = mainGroup.slice(0, reqCount);
            let trap1 = [...groups[1]].sort(() => 0.5 - Math.random())[0];
            let trap2 = [...groups[2]].sort(() => 0.5 - Math.random())[0];
            this.config.traps = [trap1, trap2];

        } else if (this.config.currentStage <= 20) {
            // 🥈 Level 2 (11~20): 얼추 비슷한 톤 등장! (시각적 혼란)
            this.config.answers = mainGroup.slice(0, reqCount);
            let remainingMain = mainGroup.filter(c => !this.config.answers.includes(c));
            let similarTraps = remainingMain.slice(0, 3); // 헷갈리는 같은 톤 3개
            let differentTrap = [...groups[1]].sort(() => 0.5 - Math.random()).slice(0, 1); // 뜬금없는 톤 1개
            this.config.traps = [...similarTraps, ...differentTrap];

        } else if (this.config.currentStage <= 30) {
            // 🥇 Level 3 (21~30): 3개 섞기 시작! (조색 장인)
            this.config.answers = mainGroup.slice(0, reqCount);
            let remainingMain = mainGroup.filter(c => !this.config.answers.includes(c));
            let similarTraps = remainingMain.slice(0, 2);
            let differentTrap = [...groups[1]].sort(() => 0.5 - Math.random()).slice(0, 1);
            this.config.traps = [...similarTraps, ...differentTrap];

        } else {
            // 💎 Level 4 (31~): 미세한 명도/채도 차이만 나는 8개 칩 등장! (절대 색감)
            this.config.answers = mainGroup.slice(0, reqCount);
            // 모든 함정(5개)을 타겟과 똑같은 계열(mainGroup)에서만 뽑음
            this.config.traps = mainGroup.slice(reqCount, reqCount + trapCount); 
        }

        // 정답 색상들을 미리 섞어서 타겟 색상 완성
        this.config.target = this.mixMultipleColors(this.config.answers);
        document.getElementById('target-view').style.backgroundColor = this.config.target;
        
        this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        this.elements.successUI.classList.remove('show');
        this.setupPalette();
    },

    setupPalette() {
        let colors = [...this.config.answers, ...this.config.traps];
        
        // 👇 [핵심] 카드를 완벽하게 섞는 전문 알고리즘(Fisher-Yates) 도입! 👇
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        
        this.elements.palette.innerHTML = '';
        const isSmall = colors.length >= 6;

        if (isSmall) {
            this.elements.palette.classList.add('left-align');
        } else {
            this.elements.palette.classList.remove('left-align');
        }

        colors.forEach(color => {
            const chip = document.createElement('div');
            chip.className = `color-chip ${isSmall ? 'small' : ''}`;
            chip.style.backgroundColor = color;
            chip.draggable = true;
            let dragIcon = null;

            chip.ondragstart = (e) => {
                if(this.config.isDone) return;
                e.dataTransfer.setData('color', color);
                this.elements.frame.classList.add('shake-effect');

                dragIcon = document.createElement('div');
                dragIcon.style.width = isSmall ? '45px' : '55px';
                dragIcon.style.height = isSmall ? '45px' : '55px';
                dragIcon.style.borderRadius = '50%';
                dragIcon.style.backgroundColor = color;
                dragIcon.style.border = '3px solid white';
                dragIcon.style.position = 'absolute';
                dragIcon.style.top = '-1000px'; 
                document.body.appendChild(dragIcon);
                
                const offset = isSmall ? 22 : 27;
                e.dataTransfer.setDragImage(dragIcon, offset, offset);
            };
            
            chip.ondragend = () => {
                this.elements.frame.classList.remove('shake-effect');
                if (dragIcon && dragIcon.parentNode) dragIcon.parentNode.removeChild(dragIcon);
            };
            this.elements.palette.appendChild(chip);
        });
    },

    bindEvents() {
        const dropZone = document.getElementById('drop-zone');
        dropZone.ondragover = e => e.preventDefault();
        dropZone.ondrop = (e) => {
            e.preventDefault();
            this.elements.frame.classList.remove('shake-effect');
            const droppedColor = e.dataTransfer.getData('color');
            this.applyLipstickShade(droppedColor);
        };
        document.getElementById('remover-btn').onclick = () => {
            this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
            this.config.currentMixed = [];
        };
    },

    // 여러 색상을 한 번에 섞는 만능 믹서기
    mixMultipleColors(colorArray) {
        let r = 0, g = 0, b = 0;
        colorArray.forEach(hex => {
            r += parseInt(hex.slice(1, 3), 16);
            g += parseInt(hex.slice(3, 5), 16);
            b += parseInt(hex.slice(5, 7), 16);
        });
        r = Math.floor(r / colorArray.length);
        g = Math.floor(g / colorArray.length);
        b = Math.floor(b / colorArray.length);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    },

    applyLipstickShade(color) {
        if (this.config.isDone || !color) return;
        
        // 👇 [효과음 추가] 준비하신 샤랄라 소리 재생!
        const audio = new Audio('music/Twinkle.mp3'); 
        audio.volume = 0.4; // 소리가 너무 크지 않게 적절히 조절
        audio.play();

        this.config.currentMixed.push(color);
        
        let finalColor = color; 
        
        if (this.config.currentMixed.length === this.config.requiredCount) {
            const hasAllAnswers = this.config.answers.every(a => this.config.currentMixed.includes(a));
            if (hasAllAnswers) {
                finalColor = this.config.target; 
            } else {
                finalColor = this.mixMultipleColors(this.config.currentMixed); 
            }
            this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        }

        const { ctx, canvas } = this.elements;
        const x = canvas.width / 2;
        const y = canvas.height * 0.37;
        const duration = 300; 
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            ctx.globalCompositeOperation = 'source-over'; 
            
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-0.3);

            const grad = ctx.createLinearGradient(0, -50, 0, 50);
            grad.addColorStop(0, hexToRgba(finalColor, 0.95));
            grad.addColorStop(0.6, hexToRgba(finalColor, 0.8));
            grad.addColorStop(1, hexToRgba(finalColor, 0));

            ctx.fillStyle = grad;
            ctx.globalAlpha = progress; 
            
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 55, 0, 0, Math.PI * 2); 
            ctx.fill();
            ctx.restore();

            if (elapsed < duration) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);

        if (this.config.currentMixed.length === this.config.requiredCount) {
            setTimeout(() => this.checkMatch(), 400); 
        }
        if(navigator.vibrate) navigator.vibrate(10);
    },

checkMatch() {
        const hasAllAnswers = this.config.answers.every(a => this.config.currentMixed.includes(a));
        
        if (hasAllAnswers) {
            this.config.isDone = true;

            // 🌸 [추가] 스테이지 성공 효과음 재생
            const successAudio = new Audio('music/Success.mp3');
            successAudio.volume = 0.3; // 너무 크지 않게 조절
            successAudio.play();

            this.showOverlay("PERFECT SHADE", "Color development complete");
            this.triggerFlowerShower(); 
            
            setTimeout(() => {
                this.config.currentStage++;
                this.elements.flowerContainer.innerHTML = ''; 
                this.generateStage();
            }, 2500);
        } else {
            this.handleWrongAnswer();
        }
    },

    // 🌸 벚꽃 잎 날리기 애니메이션 생성
    triggerFlowerShower() {
        this.elements.flowerContainer.innerHTML = '';
        // 40개의 예쁜 꽃잎을 랜덤한 위치에서 떨어뜨립니다.
        for (let i = 0; i < 40; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.style.left = Math.random() * 100 + '%';
            petal.style.top = '-20px';
            // 떨어지는 속도와 시작 시간을 다르게 해서 진짜 꽃비처럼 연출
            petal.style.animationDuration = (Math.random() * 2 + 2) + 's'; 
            petal.style.animationDelay = (Math.random() * 0.5) + 's';
            // 크기도 조금씩 다르게
            const scale = Math.random() * 0.5 + 0.6;
            petal.style.transform = `scale(${scale})`;
            
            this.elements.flowerContainer.appendChild(petal);
        }
    },

    handleWrongAnswer() {
        this.config.mistakes++;
        if (this.config.mistakes >= this.config.maxMistakes) {
            this.showOverlay("GAME OVER", "Try again from STAGE 1");
            this.config.isDone = true;
            setTimeout(() => {
                this.config.currentStage = 1; // 실패하면 1탄으로 강등!
                this.generateStage();
            }, 2500);
        } else {
            this.showOverlay("WRONG MIX", "Check the colors again!");
            setTimeout(() => {
                if(!this.config.isDone) {
                    this.elements.successUI.classList.remove('show');
                    this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
                    this.config.currentMixed = [];
                }
            }, 1200);
        }
        if(navigator.vibrate) navigator.vibrate([50, 30, 50]);
    },

    showOverlay(title, sub) {
        const textEl = this.elements.successUI.querySelector('.success-text');
        textEl.innerHTML = `<span style="letter-spacing:2px; font-weight:400;">${title}</span><br><span style="font-size:14px; font-weight:300; opacity:0.8;">${sub}</span>`;
        this.elements.successUI.classList.add('show');
    }
};

window.onload = () => {
    GameEngine.init(); 

    // 🎵 1. BGM 객체 생성 및 무한 반복 설정
    const bgm = new Audio('music/bgm.mp3');
    bgm.loop = true;   // 끝내지 않고 계속 반복
    bgm.volume = 0.25; // 고급 샵처럼 아주 은은하게 (0.12 권장)

    // 🔊 브라우저 정책 해결: 화면 어디든 첫 클릭 시 BGM 재생 시작
    const startBGM = () => {
        bgm.play().catch(e => {}); // 에러 방지용
        // 한 번 재생되면 이벤트 리스너 제거 (중복 실행 방지)
        document.removeEventListener('click', startBGM);
        document.removeEventListener('touchstart', startBGM);
    };
    document.addEventListener('click', startBGM);
    document.addEventListener('touchstart', startBGM);

    const titleScreen = document.getElementById('title-screen');
    const tutorialScreen = document.getElementById('tutorial-screen');

    // 🌸 2. 타이틀 반짝이 생성 (기존 유지)
    if (titleScreen) {
        for (let i = 0; i < 40; i++) { 
            const sparkle = document.createElement('div');
            sparkle.className = 'title-sparkle';
            sparkle.style.left = (Math.random() * 80 + 10) + '%'; 
            sparkle.style.top = (Math.random() * 70 + 15) + '%';
            const size = Math.random() * 4 + 3;
            sparkle.style.width = size + 'px';
            sparkle.style.height = size + 'px';
            sparkle.style.animationDuration = (Math.random() * 3 + 3) + 's';
            sparkle.style.animationDelay = (Math.random() * 5) + 's';
            titleScreen.appendChild(sparkle);
        }
    }

    // 🌸 3. START 버튼 클릭 (BGM은 이미 나오고 있으므로 화면 전환만)
    document.getElementById('start-btn').onclick = () => {
        new Audio('music/Twinkle.mp3').play(); // 클릭 효과음은 별도 재생
        
        tutorialScreen.style.display = 'flex'; 
        setTimeout(() => { 
            tutorialScreen.style.opacity = '1'; 
        }, 10);

        setTimeout(() => {
            titleScreen.style.display = 'none';
        }, 600);
    };

    // 📖 4. 튜토리얼 GO! 버튼 클릭
    document.getElementById('close-tutorial').onclick = () => {
        new Audio('music/Twinkle.mp3').play();
        tutorialScreen.style.opacity = '0';
        setTimeout(() => {
            tutorialScreen.style.display = 'none'; 
        }, 500);
    };

    // ❓ 5. 물음표(?) 아이콘 클릭
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
        helpBtn.onclick = () => {
            tutorialScreen.style.display = 'flex';
            setTimeout(() => { tutorialScreen.style.opacity = '1'; }, 50);
        };
    }
};