/**
 * 마이 퍼스널 쉐이드: 자동 스테이지 & 플라워 샤워 & 명성(RP) 시스템 업데이트
 */
// 👇 모바일 드래그를 위한 전역 변수 추가 👇
let isDragging = false;
let dragTarget = null;
let startX = 0;
let startY = 0;
let draggedColor = "";
let hasMoved = false; // 👈 [추가] 톡 치는 건지, 끌고 가는 건지 구분하는 판독기!
// 👆 추가 끝 👆


const GameEngine = {
    config: {
        currentStage: 1, // 현재 스테이지
        target: "",
        answers: [],
        traps: [],
        currentMixed: [],
        isDone: false,
        requiredCount: 2,
        
        // 💎 [추가] 명성 시스템 변수 세팅
        rp: 100,              // 초기 시드머니 100 RP
        combo: 0,             // 연속 정답 콤보
        currentStageFails: 0, // 현재 스테이지 오답 횟수 (누진세용)

        // 🌸 뷰티 컬러 풀
        // 🌸 64색 글로벌 감성 팔레트 (8그룹 x 8색)
        colorGroups: [
            ["#FFE4E1", "#FFB6C1", "#FFC0CB", "#FF69B4", "#FF1493", "#DB7093", "#C71585", "#F8BBD0"], // 1. Pink
            ["#FFA07A", "#FA8072", "#E9967A", "#F08080", "#CD5C5C", "#FF7F50", "#FF6347", "#FF8C00"], // 2. Coral
            ["#DC143C", "#FF0000", "#B22222", "#8B0000", "#990000", "#A52A2A", "#CC0000", "#800000"], // 3. Red
            ["#E6E6FA", "#DDA0DD", "#DA70D6", "#BA55D3", "#9370DB", "#8A2BE2", "#9400D3", "#800080"], // 4. Purple
            ["#F5F5DC", "#EDE6D6", "#E3D5CA", "#D5BDAF", "#C2A391", "#B08968", "#7F5539", "#9C6644"], // 5. Nude (신규)
            ["#E9967A", "#B76E79", "#A25050", "#8E443D", "#C08081", "#D5A0A0", "#9B6B6B", "#6D4C4C"], // 6. MLBB Rose (신규)
            ["#D2691E", "#B22222", "#A0522D", "#8B4513", "#CD853F", "#E97451", "#804000", "#5C2E00"], // 7. Brick (신규)
            ["#4B3621", "#3C2A21", "#2C1E1A", "#5D4037", "#4E342E", "#3E2723", "#21100B", "#1A0A05"]  // 8. Deep Brown (신규)
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
        this.generateStage();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.elements.canvas.width = this.elements.canvas.parentElement.offsetWidth;
        this.elements.canvas.height = this.elements.canvas.parentElement.offsetHeight;
    },

generateStage() {
        const stage = this.config.currentStage;
        let reqCount = 2;
        let trapCount = 2;

        // 🏆 기획자님 맞춤형 '초미세 밸런스' 오르막길 조정!
        if (stage <= 10) { 
            // Round 1 (1~10): Beginner (총 4개)
            reqCount = 2; trapCount = 2; 
        } else if (stage <= 20) { 
            // 🌟 Round 2-1 (11~20): 난이도 완화! (총 5개 - 정답2, 헷갈리는거1, 다른거2)
            reqCount = 2; trapCount = 3; 
        } else if (stage <= 30) { 
            // 🌟 Round 2-2 (21~30): Colorist 본격화 (총 6개)
            reqCount = 2; trapCount = 4; 
        } else if (stage <= 50) { 
            // Round 3 (31~50): Pro Artist (총 6개, 3색 조합)
            reqCount = 3; trapCount = 3; 
        } else if (stage <= 70) { 
            // Round 4 (51~70): Master (총 8개)
            reqCount = 3; trapCount = 5; 
        } else {
            // Round 5 (71~): Legendary Muse (총 8개, 하드코어)
            reqCount = 3; trapCount = 5; 
        }

        this.config.requiredCount = reqCount;
        this.config.currentMixed = [];
        this.config.isDone = false;
        
        // 💎 새 스테이지 진입 시 오답 스택 초기화
        this.config.currentStageFails = 0;
        
        // 💡 힌트 초기화 및 버튼 다시 살리기
        this.config.hintsUsed = 0;
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) hintBtn.style.display = 'block';
        this.updateRPDisplay(); 

        document.getElementById('req-count-text').innerText = `${reqCount} colors`;
        document.getElementById('stage-ui').innerText = `STAGE ${stage}`;

        // 🎨 64색 글로벌 감성 팔레트 추출 로직
        let groups = [...this.config.colorGroups].sort(() => 0.5 - Math.random());
        let mainGroup = [...groups[0]].sort(() => 0.5 - Math.random()); 

        this.config.answers = mainGroup.slice(0, reqCount);

        // 🎯 3. 라운드별 치밀한 함정(Trap) 난이도 로직
        if (stage <= 10) {
            // [1~10] 완전 다른 그룹 2개
            let trap1 = [...groups[1]].sort(() => 0.5 - Math.random())[0];
            let trap2 = [...groups[2]].sort(() => 0.5 - Math.random())[0];
            this.config.traps = [trap1, trap2];
            
        } else if (stage <= 20) {
            // 🌟 [11~20] 난이도 대폭 하향: 헷갈리는 색은 딱 1개만 등장!
            let remainingMain = mainGroup.filter(c => !this.config.answers.includes(c));
            let similarTraps = remainingMain.slice(0, 1); // 👈 1개만 뽑음!
            
            let diffTrap1 = [...groups[1]].sort(() => 0.5 - Math.random())[0];
            let diffTrap2 = [...groups[2]].sort(() => 0.5 - Math.random())[0];
            
            this.config.traps = [...similarTraps, diffTrap1, diffTrap2];
            
        } else if (stage <= 30) {
            // 🌟 [21~30] 헷갈리는 색 2개 등장 (기존 11단계 난이도)
            let remainingMain = mainGroup.filter(c => !this.config.answers.includes(c));
            let similarTraps = remainingMain.slice(0, 2); 
            
            let diffTrap1 = [...groups[1]].sort(() => 0.5 - Math.random())[0];
            let diffTrap2 = [...groups[2]].sort(() => 0.5 - Math.random())[0];
            
            this.config.traps = [...similarTraps, diffTrap1, diffTrap2];
            
        } else if (stage <= 50) {
            // [31~50] 3색 조합 집중 (비슷한 색 2개 + 뜬금없는 색 1개)
            let remainingMain = mainGroup.filter(c => !this.config.answers.includes(c));
            let similarTraps = remainingMain.slice(0, 2); 
            let diffTrap = [...groups[1]].sort(() => 0.5 - Math.random())[0]; 
            this.config.traps = [...similarTraps, diffTrap];
            
        } else if (stage <= 70) {
            // [51~70] 하드코어 진입 (함정 5개 중 4개는 비슷하게, 1개만 다르게)
            let remainingMain = mainGroup.filter(c => !this.config.answers.includes(c));
            let similarTraps = remainingMain.slice(0, 4);
            let diffTrap = [...groups[1]].sort(() => 0.5 - Math.random())[0];
            this.config.traps = [...similarTraps, diffTrap];
            
        } else {
            // [71~] 절대 색감의 영역 (전부 다 비슷한 색상)
            let remainingMain = mainGroup.filter(c => !this.config.answers.includes(c));
            this.config.traps = remainingMain.slice(0, trapCount); 
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
// 💡 힌트 기능에서 정답을 찾기 위해 색상값 기록해두기
            chip.dataset.color = color;
            const handleDragStart = (e) => {
                if (this.config.isDone) return;
                isDragging = true;
                dragTarget = chip;
                draggedColor = color; 
                
                const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                
                startX = clientX;
                startY = clientY;
                hasMoved = false; // 👈 [추가] 터치 시작할 때는 무조건 false로 리셋!
                
                chip.style.zIndex = '1000';
                chip.style.transition = 'none';
                this.elements.frame.classList.add('shake-effect');
            };

            chip.addEventListener('touchstart', handleDragStart, { passive: false });
            chip.addEventListener('mousedown', handleDragStart);

            this.elements.palette.appendChild(chip);
        });
    },

    bindEvents() {
        const dropZone = document.getElementById('drop-zone');
        
        const handleDragMove = (e) => {
            if (!isDragging || !dragTarget) return;
            if (e.cancelable) e.preventDefault();

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;
            
            // 💡 [추가] 10px 이상 움직여야 '진짜 드래그'로 인정! (제자리 탭 방지)
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                hasMoved = true;
            }

            dragTarget.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
        };
        const handleDragEnd = (e) => {
            if (!isDragging || !dragTarget) return;

            const clientX = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.changedTouches[0].clientY : e.clientY;

           const rect = dropZone.getBoundingClientRect();
            const isInside = (
                clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom
            );

            this.elements.frame.classList.remove('shake-effect');

            // 💡 [핵심 수정] 드롭존 안쪽이고 && 실제로 손가락을 끌었을 때만 색상 투입!
            if (isInside && hasMoved) {
                this.applyLipstickShade(draggedColor);
            }

            dragTarget.style.transform = 'translate(0, 0)';
            dragTarget.style.zIndex = '';
            dragTarget.style.transition = 'all 0.3s ease';
            
            isDragging = false;
            dragTarget = null;
            draggedColor = "";
        };

        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);

        document.getElementById('remover-btn').onclick = () => {
            this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
            this.config.currentMixed = [];
        };
        // 💡 힌트 버튼 클릭 이벤트
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.onclick = () => {
                if (this.config.isDone) return; 
                
                if (this.config.hintsUsed < this.config.requiredCount) {
                    const answerColor = this.config.answers[this.config.hintsUsed];
                    
                    const chips = document.querySelectorAll('.color-chip');
                    chips.forEach(chip => {
                        if (chip.dataset.color === answerColor) {
                            chip.classList.add('chip-glow');
                        }
                    });

                    new Audio('music/Twinkle.mp3').play(); 
                    this.config.hintsUsed++; 
                }

                if (this.config.hintsUsed >= this.config.requiredCount) {
                    hintBtn.style.display = 'none';
                }
            };
        }
    },

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
        // 🛡️ [추가] 중복 터치 버그 방어막: 이미 요구된 개수가 다 찼으면 함수 중단!
        if (this.config.currentMixed.length >= this.config.requiredCount) return;
        const audio = new Audio('music/Twinkle.mp3'); 
        audio.volume = 0.4; 
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

            // 💎 [추가] 기획자님표 명성 획득 수식 적용!
            const isPerfect = (this.config.currentStageFails === 0);
            const stageReward = this.config.currentStage * 20;
            const perfectBonus = isPerfect ? 100 : 0;
            const comboBonus = this.config.combo * 50;
            
            const earnedRP = stageReward + perfectBonus + comboBonus;
            this.config.rp += earnedRP; 
            this.config.combo++; // 콤보 증가
            
            const successAudio = new Audio('music/Success.mp3');
            successAudio.volume = 0.3;
            successAudio.play();

            // 얼마 벌었는지 자랑하기
            this.showOverlay("PERFECT SHADE", `+${earnedRP} RP 획득! (현재 ${this.config.rp} RP)`);
            this.updateRPDisplay();
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

    triggerFlowerShower() {
        this.elements.flowerContainer.innerHTML = '';
        for (let i = 0; i < 40; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.style.left = Math.random() * 100 + '%';
            petal.style.top = '-20px';
            petal.style.animationDuration = (Math.random() * 2 + 2) + 's'; 
            petal.style.animationDelay = (Math.random() * 0.5) + 's';
            const scale = Math.random() * 0.5 + 0.6;
            petal.style.transform = `scale(${scale})`;
            this.elements.flowerContainer.appendChild(petal);
        }
    },

    // 💎 [전면 개편] 오답 시 누진세 페널티 및 파산 체크 로직
    handleWrongAnswer() {
        this.config.currentStageFails++; // 이번 판 실수 카운트 1증가
        this.config.combo = 0; // 뼈아픈 콤보 리셋

        // 기획자님표 누진세 페널티
        let penalty = 0;
        if (this.config.currentStageFails === 1) {
            penalty = 10;
        } else {
            penalty = (this.config.currentStageFails - 1) * 50;
        }

        this.config.rp -= penalty; // 명성 차감
        this.updateRPDisplay();

        // 파산 체크 (0 미만이 되면 즉시 게임오버!)
        if (this.config.rp < 0) {
            this.showOverlay("BANKRUPT", "명성을 모두 잃었습니다.<br>처음부터 다시 시작합니다.");
            this.config.isDone = true;
            setTimeout(() => {
                this.config.currentStage = 1; // 1스테이지로 강등
                this.config.rp = 100;         // 초기 자본 100 복구
                this.config.combo = 0;
                this.generateStage();
            }, 3000);
        } else {
            // 아직 파산 안 했으면 페널티 경고
            this.showOverlay("WRONG MIX", `페널티 -${penalty} RP<br>남은 명성: ${this.config.rp} RP`);
            setTimeout(() => {
                if(!this.config.isDone) {
                    this.elements.successUI.classList.remove('show');
                    this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
                    this.config.currentMixed = [];
                }
            }, 1800);
        }
        if(navigator.vibrate) navigator.vibrate([50, 30, 50]);
    },

    showOverlay(title, sub) {
        const textEl = this.elements.successUI.querySelector('.success-text');
        textEl.innerHTML = `<span style="letter-spacing:2px; font-weight:400;">${title}</span><br><span style="font-size:14px; font-weight:300; opacity:0.8;">${sub}</span>`;
        this.elements.successUI.classList.add('show');
    },

 // 💎 [전면 개편] 칭호(Title) & 명성치 UI 업데이트 함수
    updateRPDisplay() {
        const rpEl = document.getElementById('rp-display');
        const titleEl = document.getElementById('title-display');
        const currentRP = this.config.rp;

        if (rpEl) {
            rpEl.innerText = `💎 ${currentRP} RP`;
            if(currentRP < 50) rpEl.style.color = "#ff4444"; // 파산 위기 경고
            else rpEl.style.color = "#ffd700";
        }

        if (titleEl) {
            // 👑 명성치에 따른 칭호 및 디자인 로직
            let title = "Beginner";
            let color = "#ffffff"; // 기본 화이트
            let glow = "0 2px 4px rgba(0,0,0,0.5)"; // 기본 그림자

            if (currentRP >= 500000) { 
                title = "Legendary Muse"; color = "#e0b0ff"; glow = "0 0 10px rgba(224,176,255,0.9)"; // 영롱한 보라빛 아우라
            } else if (currentRP >= 100000) { 
                title = "Icon"; color = "#e0f7fa"; glow = "0 0 8px rgba(224,247,250,0.8)"; // 다이아몬드 화이트 아우라
            } else if (currentRP >= 20000) { 
                title = "Master"; color = "#ffb6c1"; glow = "0 0 6px rgba(255,182,193,0.6)"; // 로즈골드 아우라
            } else if (currentRP >= 5000) { 
                title = "Pro Artist"; color = "#e8e8e8"; glow = "0 0 5px rgba(255,255,255,0.5)"; // 실버 광택
            } else if (currentRP >= 1000) { 
                title = "Colorist"; color = "#ffc0cb"; glow = "0 2px 4px rgba(0,0,0,0.5)"; // 은은한 핑크
            }

            titleEl.innerText = title;
            titleEl.style.color = color;
            titleEl.style.textShadow = glow;
        }
    }
};

window.onload = () => {
    GameEngine.init(); 

    const bgm = new Audio('music/bgm.mp3');
    bgm.loop = true;   
    bgm.volume = 0.25; 

    const startBGM = () => {
        bgm.play().catch(e => {}); 
        document.removeEventListener('click', startBGM);
        document.removeEventListener('touchstart', startBGM);
    };
    document.addEventListener('click', startBGM);
    document.addEventListener('touchstart', startBGM);

    const titleScreen = document.getElementById('title-screen');
    const tutorialScreen = document.getElementById('tutorial-screen');

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

    document.getElementById('start-btn').onclick = () => {
        new Audio('music/Twinkle.mp3').play(); 
        
        tutorialScreen.style.display = 'flex'; 
        setTimeout(() => { 
            tutorialScreen.style.opacity = '1'; 
        }, 10);

        setTimeout(() => {
            titleScreen.style.display = 'none';
        }, 600);
    };

    document.getElementById('close-tutorial').onclick = () => {
        new Audio('music/Twinkle.mp3').play();
        tutorialScreen.style.opacity = '0';
        setTimeout(() => {
            tutorialScreen.style.display = 'none'; 
        }, 500);
    };

    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
        helpBtn.onclick = () => {
            tutorialScreen.style.display = 'flex';
            setTimeout(() => { tutorialScreen.style.opacity = '1'; }, 50);
        };
    }
};
