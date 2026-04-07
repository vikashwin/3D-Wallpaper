(function() {
            // ---------- DEFAULT IMAGES ----------
            const DEFAULT_IMAGES = [
                'https://picsum.photos/id/1015/800/800',
                'https://picsum.photos/id/1016/800/800',
                'https://picsum.photos/id/1020/800/800',
                'https://picsum.photos/id/1024/800/800',
                'https://picsum.photos/id/1035/800/800',
                'https://picsum.photos/id/1038/800/800'
            ];
            
            // DOM elements
            const wallpaperContainer = document.getElementById('wallpaper');
            const container = document.getElementById('container');
            const pauseButton = document.getElementById('pauseButton');
            const zoomIndicator = document.getElementById('zoomIndicator');
            
            // 3D state
            let currentImages = [...DEFAULT_IMAGES];
            let radius = 360;
            let rotationY = 0;
            let rotationX = 0;
            let zoomFactor = 1.0;
            let isAutoRotatePaused = false;
            let autoRotateSpeed = 0.28;
            let isDragging = false;
            let longPressTimer = null;
            let startX = 0, startY = 0;
            const longPressDuration = 280;
            const keyboardStep = 4;
            let panelElements = [];
            
            // ---------- MUSIC PLAYER ----------
            let audioPlayer = null;
            let currentMusicSrc = null;
            const playPauseBtn = document.getElementById('playPauseMusicBtn');
            const stopMusicBtn = document.getElementById('stopMusicBtn');
            const volumeSlider = document.getElementById('volumeControl');
            const musicFileInput = document.getElementById('musicFileInput');
            const uploadMusicLabel = document.getElementById('uploadMusicLabel');
            const trackInfoDisplay = document.getElementById('trackInfoDisplay');
            const musicStatusIcon = document.getElementById('musicStatusIcon');
            
            function initAudio() {
                if (!audioPlayer) {
                    audioPlayer = new Audio();
                    audioPlayer.loop = true;
                    audioPlayer.volume = 0.5;
                    volumeSlider.value = 0.5;
                    audioPlayer.addEventListener('ended', () => {
                        if (playPauseBtn) playPauseBtn.innerHTML = '▶️';
                        musicStatusIcon.innerHTML = '⏹️';
                    });
                    audioPlayer.addEventListener('play', () => {
                        playPauseBtn.innerHTML = '⏸️';
                        musicStatusIcon.innerHTML = '🎵';
                    });
                    audioPlayer.addEventListener('pause', () => {
                        playPauseBtn.innerHTML = '▶️';
                        if (!audioPlayer.currentTime || audioPlayer.paused) musicStatusIcon.innerHTML = '⏸️';
                    });
                }
            }
            
            function loadMusic(file) {
                if (!file || !file.type.includes('audio')) {
                    alert('Please select a valid audio file (MP3, WAV, OGG)');
                    return;
                }
                initAudio();
                const url = URL.createObjectURL(file);
                if (currentMusicSrc) URL.revokeObjectURL(currentMusicSrc);
                currentMusicSrc = url;
                audioPlayer.src = url;
                audioPlayer.load();
                trackInfoDisplay.innerText = `🎧 ${file.name.substring(0, 28)}${file.name.length > 28 ? '…' : ''}`;
                // attempt autoplay (browser may restrict, but we let user click play)
                audioPlayer.play().catch(e => {
                    console.log("Autoplay blocked, click play button");
                    musicStatusIcon.innerHTML = '⏹️';
                    playPauseBtn.innerHTML = '▶️';
                });
            }
            
            function togglePlayPause() {
                if (!audioPlayer || !audioPlayer.src) {
                    alert('Please upload a music file first using 📂 button');
                    return;
                }
                if (audioPlayer.paused) {
                    audioPlayer.play().catch(e => alert('Playback error, try again'));
                } else {
                    audioPlayer.pause();
                }
            }
            
            function stopMusic() {
                if (audioPlayer) {
                    audioPlayer.pause();
                    audioPlayer.currentTime = 0;
                    playPauseBtn.innerHTML = '▶️';
                    musicStatusIcon.innerHTML = '⏹️';
                }
            }
            
            function setVolume(value) {
                if (audioPlayer) audioPlayer.volume = parseFloat(value);
            }
            
            // ---- Gallery rebuild functions ----
            function updateTransform() {
                wallpaperContainer.style.transform = `scale(${zoomFactor}) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
                if (zoomIndicator) zoomIndicator.innerText = `Zoom: ${zoomFactor.toFixed(1)}x`;
            }
            
            function adaptRadiusBasedOnCount() {
                const count = currentImages.length;
                if (count >= 10) radius = 395;
                else if (count >= 7) radius = 378;
                else radius = 360;
                refreshPanelPositions();
            }
            
            function refreshPanelPositions() {
                if (!panelElements.length) return;
                const count = panelElements.length;
                const stepAngle = 360 / count;
                panelElements.forEach((panel, idx) => {
                    const angle = idx * stepAngle;
                    panel.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
                });
            }
            
            function finalRebuild() {
                while (wallpaperContainer.firstChild) wallpaperContainer.removeChild(wallpaperContainer.firstChild);
                panelElements = [];
                const count = currentImages.length;
                if (count === 0) return;
                const step = 360 / count;
                currentImages.forEach((url, idx) => {
                    const panel = document.createElement('div');
                    panel.className = 'panel';
                    panel.style.backgroundImage = `url('${url}')`;
                    panel.style.backgroundSize = 'cover';
                    panel.style.backgroundPosition = 'center';
                    const angle = idx * step;
                    panel.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
                    wallpaperContainer.appendChild(panel);
                    panelElements.push(panel);
                });
                updateTransform();
                adaptRadiusBasedOnCount();
            }
            
            function loadImagesFromFiles(files) {
                if (!files || files.length === 0) return;
                const maxAllowed = 16;
                const selectedFiles = Array.from(files).slice(0, maxAllowed);
                if (selectedFiles.length === 0) return;
                const newUrls = [];
                let loaded = 0;
                const totalValid = selectedFiles.length;
                const uploadLabelTrigger = document.getElementById('compactUploadTrigger');
                const originalText = uploadLabelTrigger?.innerHTML;
                if (uploadLabelTrigger) uploadLabelTrigger.innerHTML = `⏳ ${totalValid}`;
                
                selectedFiles.forEach(file => {
                    if (!file.type.startsWith('image/')) {
                        loaded++;
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        newUrls.push(ev.target.result);
                        loaded++;
                        if (loaded === totalValid) {
                            if (newUrls.length) {
                                currentImages = [...newUrls];
                                finalRebuild();
                                updateTransform();
                                if (uploadLabelTrigger) {
                                    uploadLabelTrigger.innerHTML = `✅ ${newUrls.length}`;
                                    setTimeout(() => {
                                        if (uploadLabelTrigger) uploadLabelTrigger.innerHTML = `📤 Upload`;
                                    }, 1800);
                                }
                            } else {
                                alert('No valid images selected.');
                                if (uploadLabelTrigger) uploadLabelTrigger.innerHTML = `📤 Upload`;
                            }
                        }
                    };
                    reader.onerror = () => {
                        loaded++;
                        if (loaded === totalValid && newUrls.length === 0) {
                            alert('Some images failed to load');
                            if (uploadLabelTrigger) uploadLabelTrigger.innerHTML = `📤 Upload`;
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }
            
            function resetToDefaults() {
                currentImages = [...DEFAULT_IMAGES];
                finalRebuild();
                updateTransform();
                const resetBtn = document.getElementById('resetDefaultBtn');
                if (resetBtn) {
                    const orig = resetBtn.innerHTML;
                    resetBtn.innerHTML = '✓ Done';
                    setTimeout(() => { resetBtn.innerHTML = orig; }, 1000);
                }
            }
            
            // ---- Interactions (drag, zoom, keys) ----
            function startRotation(e) {
                e.preventDefault();
                const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? 0);
                const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? 0);
                startX = clientX;
                startY = clientY;
                longPressTimer = setTimeout(() => {
                    isDragging = true;
                    container.classList.add('grabbing');
                    longPressTimer = null;
                }, longPressDuration);
            }
            
            function stopRotation() {
                if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
                isDragging = false;
                container.classList.remove('grabbing');
            }
            
            function onRotateMove(e) {
                if (!isDragging) return;
                e.preventDefault();
                const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? 0);
                const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? 0);
                const deltaX = clientX - startX;
                const deltaY = clientY - startY;
                rotationY += deltaX * 0.55;
                rotationX -= deltaY * 0.35;
                rotationX = Math.max(-35, Math.min(35, rotationX));
                updateTransform();
                startX = clientX;
                startY = clientY;
            }
            
            function handleZoom(e) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.08 : 0.08;
                let newZoom = zoomFactor + delta;
                newZoom = Math.min(2.2, Math.max(0.55, newZoom));
                zoomFactor = newZoom;
                updateTransform();
            }
            
            function onKeyDown(e) {
                let changed = false;
                if (e.key === 'ArrowLeft') { rotationY -= keyboardStep; changed = true; }
                else if (e.key === 'ArrowRight') { rotationY += keyboardStep; changed = true; }
                else if (e.key === 'ArrowUp') { rotationX -= keyboardStep; changed = true; }
                else if (e.key === 'ArrowDown') { rotationX += keyboardStep; changed = true; }
                if (changed) {
                    e.preventDefault();
                    rotationX = Math.max(-35, Math.min(35, rotationX));
                    updateTransform();
                }
            }
            
            let animationId = null;
            function startAutoRotateLoop() {
                if (animationId) cancelAnimationFrame(animationId);
                function animate() {
                    if (!isAutoRotatePaused && !isDragging) {
                        rotationY += autoRotateSpeed;
                        updateTransform();
                    }
                    animationId = requestAnimationFrame(animate);
                }
                animate();
            }
            
            function toggleAutoRotate() {
                isAutoRotatePaused = !isAutoRotatePaused;
                pauseButton.innerHTML = isAutoRotatePaused ? '▶️ Resume' : '⏸️ Pause';
            }
            
            // ---- Bind events & initialize ----
            function bindEvents() {
                container.addEventListener('mousedown', startRotation);
                container.addEventListener('touchstart', startRotation, { passive: false });
                document.addEventListener('mouseup', stopRotation);
                document.addEventListener('touchend', stopRotation);
                container.addEventListener('mousemove', onRotateMove);
                container.addEventListener('touchmove', onRotateMove, { passive: false });
                container.addEventListener('wheel', handleZoom, { passive: false });
                document.addEventListener('keydown', onKeyDown);
                pauseButton.addEventListener('click', toggleAutoRotate);
                
                // image upload via compact trigger
                const fileInput = document.getElementById('imageUploadInput');
                const compactTrigger = document.getElementById('compactUploadTrigger');
                if (compactTrigger && fileInput) {
                    compactTrigger.addEventListener('click', (e) => {
                        if (e.target !== fileInput) fileInput.click();
                    });
                    fileInput.addEventListener('change', (e) => {
                        if (fileInput.files && fileInput.files.length) loadImagesFromFiles(fileInput.files);
                        fileInput.value = '';
                    });
                }
                const resetBtn = document.getElementById('resetDefaultBtn');
                if (resetBtn) resetBtn.addEventListener('click', resetToDefaults);
                
                // Music controls
                initAudio();
                playPauseBtn.addEventListener('click', togglePlayPause);
                stopMusicBtn.addEventListener('click', stopMusic);
                volumeSlider.addEventListener('input', (e) => setVolume(e.target.value));
                uploadMusicLabel.addEventListener('click', () => musicFileInput.click());
                musicFileInput.addEventListener('change', (e) => {
                    if (musicFileInput.files && musicFileInput.files[0]) {
                        loadMusic(musicFileInput.files[0]);
                    }
                    musicFileInput.value = '';
                });
                container.addEventListener('contextmenu', (e) => e.preventDefault());
            }
            
            // initial build
            finalRebuild();
            bindEvents();
            startAutoRotateLoop();
            updateTransform();
            
            // extra polish: change status icon on audio events
            if (audioPlayer) {
                audioPlayer.addEventListener('play', () => { if(playPauseBtn) playPauseBtn.innerHTML = '⏸️'; musicStatusIcon.innerHTML = '🎵'; });
                audioPlayer.addEventListener('pause', () => { if(playPauseBtn) playPauseBtn.innerHTML = '▶️'; musicStatusIcon.innerHTML = '⏸️'; });
                audioPlayer.addEventListener('stop', () => { if(playPauseBtn) playPauseBtn.innerHTML = '▶️'; });
            }
        })();