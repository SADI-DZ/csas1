/**
 * Windows 11 Standalone Simulator
 * Ported from React to Vanilla JS for the Informatics Lab
 */

class Win11Simulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.state = {
            step: 'BOOT_BIOS', // BOOT_BIOS, BIOS_SETUP, BOOT_WINDOWS, SETUP_LANGUAGE, ...
            isWindowsInstalled: false,
            isSetupDone: false,
            biosLines: [],
            bootOrder: [
                { id: 'nvme', label: 'NVMe SSD: SAMSUNG MZVL2512HDJD', type: 'NVMe', enabled: true },
                { id: 'usb', label: 'USB Device: Kingston DataTraveler', type: 'USB', enabled: true },
                { id: 'sata', label: 'SATA HDD: WD Blue 1TB', type: 'SATA', enabled: true },
                { id: 'dvd', label: 'CD/DVD ROM: HL-DT-ST DVDRAM', type: 'SATA', enabled: false },
                { id: 'network', label: 'Network Boot: Realtek PXE', type: 'Network', enabled: false }
            ],
            biosSelectedIdx: 0,
            disks: [
                { id: 0, name: 'Drive 0 Unallocated Space', size: '512 GB', sizeMB: 524288, type: 'Unallocated', isPartition: false }
            ],
            selectedDiskId: null,
            installPercent: 0,
            accountName: '',
            desktopTime: new Date()
        };

        this.init();
        this.addKeyboardListeners();
    }

    init() {
        this.render();
        this.startBootSequence();
        
        // Update clock if on desktop
        setInterval(() => {
            if (this.state.step === 'DESKTOP') {
                this.state.desktopTime = new Date();
                this.updateClock();
            }
        }, 1000);
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    startBootSequence() {
        const biosTexts = [
            'American Megatrends International, LLC.',
            'BIOS Date: 01/15/2025',
            'CPU: Intel(R) Core(TM) i9-14900K @ 3.20GHz',
            'Memory Test: 32768 MB OK',
            'NVMe SSD: SAMSUNG MZVL2512HDJD-00BL2',
            'Press DEL to enter BIOS Setup, F12 for Boot Menu',
            '',
            'Booting from NVMe SSD...',
        ];

        let lineIdx = 0;
        const interval = setInterval(() => {
            if (lineIdx < biosTexts.length) {
                this.state.biosLines.push(biosTexts[lineIdx]);
                this.render();
                lineIdx++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    const firstEnabled = this.state.bootOrder.find(d => d.enabled);
                    if (firstEnabled?.id === 'usb') {
                        this.setState({ step: 'BOOT_WINDOWS' });
                        this.setupWindowsTransition();
                    } else if (firstEnabled?.id === 'nvme' && this.state.isWindowsInstalled) {
                        this.setState({ step: 'BOOT_WINDOWS' });
                        this.setupWindowsTransition();
                    } else {
                        this.setState({ step: 'NO_OS_ERROR' });
                    }
                }, 1000);
            }
        }, 400);

        // Listen for DEL key
        const handleDel = (e) => {
            if (e.key === 'Delete' || e.key === 'Escape') {
                clearInterval(interval);
                this.setState({ step: 'BIOS_SETUP' });
                window.removeEventListener('keydown', handleDel);
            }
        };
        window.addEventListener('keydown', handleDel);
    }

    setupWindowsTransition() {
        setTimeout(() => {
            if (this.state.isSetupDone) this.setState({ step: 'DESKTOP' });
            else if (this.state.isWindowsInstalled) this.setState({ step: 'OOBE_HI' });
            else this.setState({ step: 'SETUP_LANGUAGE' });
        }, 3000);
    }

    startInstallation() {
        this.setState({ step: 'INSTALLING', installPercent: 0 });
        const interval = setInterval(() => {
            if (this.state.installPercent < 100) {
                this.setState({ installPercent: this.state.installPercent + 1 });
            } else {
                clearInterval(interval);
                this.state.isWindowsInstalled = true;
                setTimeout(() => {
                    this.state.biosLines = [];
                    this.setState({ step: 'BOOT_BIOS' });
                    this.startBootSequence();
                }, 1000);
            }
        }, 80);
    }

    // --- Partitioning Logic ---
    handleCreatePartition(sizeMB) {
        const disk = this.state.disks.find(d => d.id === this.state.selectedDiskId);
        if (!disk || disk.isPartition || disk.sizeMB < sizeMB) return;

        // Create system partitions if first partition
        const hasPartitions = this.state.disks.some(d => d.isPartition);
        let newDisks = this.state.disks.filter(d => d.id !== disk.id);

        if (!hasPartitions) {
            newDisks.push({ id: Date.now() + 1, name: 'Drive 0 Partition 1: System', size: '100 MB', sizeMB: 100, type: 'System', isPartition: true });
            newDisks.push({ id: Date.now() + 2, name: 'Drive 0 Partition 2: MSR', size: '16 MB', sizeMB: 16, type: 'MSR', isPartition: true });
        }

        const mainPart = {
            id: Date.now() + 3,
            name: `Drive 0 Partition ${hasPartitions ? 2 : 3}`,
            size: `${(sizeMB / 1024).toFixed(1)} GB`,
            sizeMB: sizeMB,
            type: 'Primary',
            isPartition: true
        };
        newDisks.push(mainPart);

        const remaining = disk.sizeMB - sizeMB - (hasPartitions ? 0 : 116);
        if (remaining > 0) {
            newDisks.push({
                id: Date.now() + 4,
                name: 'Drive 0 Unallocated Space',
                size: `${(remaining / 1024).toFixed(1)} GB`,
                sizeMB: remaining,
                type: 'Unallocated',
                isPartition: false
            });
        }

        this.setState({ disks: newDisks, selectedDiskId: mainPart.id });
    }

    handleFormat() {
        if (this.state.selectedDiskId === null) return;
        const newDisks = this.state.disks.map(d => 
            d.id === this.state.selectedDiskId ? { ...d, type: 'Primary (Formatted)' } : d
        );
        this.setState({ disks: newDisks });
    }

    // --- Rendering Logic ---
    render() {
        if (!this.container) return;
        
        let html = '';
        const s = this.state;

        switch (s.step) {
            case 'BOOT_BIOS':
                html = `
                    <div class="bios-screen" style="text-align:left;" dir="ltr">
                        <div style="max-width:800px;">
                            ${s.biosLines.map(line => `<div>${line}</div>`).join('')}
                            <div class="bios-cursor"></div>
                        </div>
                        <div style="position:absolute; bottom:20px; left:20px; color:#fbbf24; font-size:12px;">
                            [ Press DEL to enter BIOS Setup ]
                        </div>
                    </div>
                `;
                break;

            case 'BIOS_SETUP':
                html = this.renderBiosSetup();
                break;

            case 'NO_OS_ERROR':
                html = `
                    <div class="win-setup-screen" style="background:black; color:white; font-family:monospace; align-items:start; text-align:left;" dir="ltr">
                        <div style="max-width:600px; margin: 0 auto; padding-top: 50px;">
                            <p style="font-size:18px; margin-bottom:20px;">An operating system wasn't found. Try disconnecting any drives that don't contain an operating system.</p>
                            <p style="opacity:0.7; margin-bottom:40px;">Press Restart button to try again.</p>
                            
                            <button class="win-btn" onclick="simulator.setState({step:'BOOT_BIOS', biosLines:[]}); simulator.startBootSequence();">Restart</button>
                            <button class="win-btn" style="background:transparent; color:white; border:1px solid white; margin-left:10px;" onclick="simulator.setState({step:'BIOS_SETUP'})">Enter BIOS</button>

                            <div class="edu-hint" style="margin-top:60px; text-align:right;" dir="rtl">
                                <div class="edu-hint-title">⚠️ تنبيه تعليمي: فشل الإقلاع</div>
                                <p>هذا الخطأ يظهر لأن الحاسوب حاول الإقلاع من القرص الصلب وهو فارغ. يجب الدخول للإعدادات وتغيير الترتيب ليصبح الـ USB هو الأول.</p>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'BOOT_WINDOWS':
                html = `
                    <div class="win-setup-screen" style="background:black;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/Windows_logo_-_2021.svg" width="80" style="margin-bottom:40px; filter: invert(1);">
                        <div class="win-spinner">
                            ${Array.from({length:8}).map((_,i) => `<div class="win-spinner-dot" style="animation-delay:${i*0.1}s; transform: rotate(${i*45}deg) translate(16px);"></div>`).join('')}
                        </div>
                    </div>
                `;
                break;

            case 'SETUP_LANGUAGE':
                html = `
                    <div class="win-setup-screen" style="text-align:left;" dir="ltr">
                        <div class="win-setup-card" dir="ltr" style="text-align:left;">
                            <h2 style="font-size:24px; margin-bottom:30px;">Windows Setup</h2>
                            <div style="margin-bottom:20px;">
                                <label style="display:block; margin-bottom:5px; font-size:14px;">Language to install:</label>
                                <select class="win-input"><option>English (United States)</option><option>Arabic (Algeria)</option></select>
                            </div>
                            <div style="margin-bottom:20px;">
                                <label style="display:block; margin-bottom:5px; font-size:14px;">Time and currency format:</label>
                                <select class="win-input"><option>English (United States)</option></select>
                            </div>
                            <div style="margin-bottom:40px;">
                                <label style="display:block; margin-bottom:5px; font-size:14px;">Keyboard or input method:</label>
                                <select class="win-input"><option>US</option><option>Arabic (101)</option></select>
                            </div>
                            <button class="win-btn" onclick="simulator.setState({step:'SETUP_INSTALL'})">Next</button>
                            
                            <div class="edu-hint" style="text-align:right;" dir="rtl">
                                <div class="edu-hint-title">💡 معلومة</div>
                                <p>في هذه الخطوة نحدد اللغة الأساسية للنظام وتنسيقات الأرقام والوقت المناسبة لمنطقتنا.</p>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'SETUP_INSTALL':
                html = `
                    <div class="win-setup-screen">
                        <button class="win-btn" style="font-size:20px; padding:15px 50px;" onclick="simulator.setState({step:'SETUP_DISK'})">Install Now (التثبيت الآن)</button>
                    </div>
                `;
                break;

            case 'SETUP_DISK':
                html = this.renderDiskSetup();
                break;

            case 'INSTALLING':
                html = `
                    <div class="win-setup-screen" style="background:var(--win-dark-blue); text-align:left;" dir="ltr">
                        <div style="width:100%; max-width:400px;">
                            <h2 style="font-size:24px; margin-bottom:10px;">Installing Windows</h2>
                            <p style="opacity:0.7; font-size:14px; margin-bottom:40px;">Your PC will restart several times. Sit back and relax.</p>
                            
                            <div style="background:rgba(255,255,255,0.1); height:4px; border-radius:2px; overflow:hidden; margin-bottom:10px;">
                                <div style="background:white; height:100%; width:${s.installPercent}%; transition:width 0.3s;"></div>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.6;">
                                <span>${s.installPercent}%</span>
                                <span>Please wait...</span>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'OOBE_HI':
                html = `
                    <div class="win-setup-screen" style="text-align:left;" dir="ltr">
                        <div style="animation: fadeIn 2s;">
                            <h1 style="font-size:60px; font-weight:300; margin-bottom:20px;">Hi</h1>
                            <p style="font-size:20px; opacity:0.8; margin-bottom:40px;">We're setting things up for you.</p>
                            <div class="win-spinner"></div>
                            <button class="win-btn" style="margin-top:50px; background:transparent; color:white; border:1px solid white;" onclick="simulator.setState({step:'DESKTOP', isSetupDone:true})">Skip setup</button>
                        </div>
                    </div>
                `;
                break;

            case 'DESKTOP':
                html = `
                    <div class="win-desktop">
                        <div style="position:absolute; top:20px; left:20px; display:flex; flex-direction:column; gap:20px; align-items:center;">
                            <div style="text-align:center;"><span style="font-size:30px;">💻</span><div style="font-size:12px; text-shadow:0 2px 4px rgba(0,0,0,0.5);">This PC</div></div>
                            <div style="text-align:center;"><span style="font-size:30px;">🗑️</span><div style="font-size:12px; text-shadow:0 2px 4px rgba(0,0,0,0.5);">Recycle Bin</div></div>
                        </div>
                        
                        <div class="win-taskbar" dir="ltr">
                            <button style="background:transparent; border:none; color:white; font-size:20px; cursor:pointer;" onclick="alert('Start Menu Coming Soon')">🪟</button>
                            <div id="desktop-clock" style="text-align:center; font-size:12px; line-height:1.2;">
                                <div>${this.formatTime(s.desktopTime)}</div>
                                <div>${this.formatDate(s.desktopTime)}</div>
                            </div>
                        </div>
                    </div>
                `;
                break;
        }

        this.container.innerHTML = html;
    }

    renderBiosSetup() {
        const s = this.state;
        const tabs = ['Main', 'Advanced', 'Boot', 'Exit'];
        const selectedDevice = s.bootOrder[s.biosSelectedIdx];
        
        return `
            <div class="bios-setup" dir="ltr" style="background:#000022; font-family:monospace; color:#ccc;">
                <div class="bios-setup-header" style="background:transparent; border:none; padding:15px 0;">
                    <div style="font-size:22px; font-weight:bold; color:var(--bios-amber); letter-spacing:1px;">American Megatrends International, LLC.</div>
                    <div style="font-size:12px; opacity:0.6; margin-top:5px;">BIOS Setup Utility - Version 2.20.1271</div>
                </div>
                
                <div class="bios-setup-tabs" style="background:#000044; border:1px solid rgba(255,255,255,0.1); border-left:none; border-right:none;">
                    ${tabs.map(tab => `
                        <div class="bios-tab ${tab === 'Boot' ? 'active' : ''}" style="border:none; font-size:16px; padding:10px 0;">${tab}</div>
                    `).join('')}
                </div>
                
                <div class="bios-setup-main" style="border:1px solid rgba(255,255,255,0.1); border-top:none;">
                    <div class="bios-setup-content" style="padding:20px; text-align:left;">
                        <!-- Boot Configuration -->
                        <div style="color:var(--bios-amber); font-weight:bold; margin-bottom:15px; font-size:14px;">Boot Configuration</div>
                        <div style="display:grid; grid-template-columns: 200px 1fr; gap:10px; margin-bottom:30px; font-size:13px;">
                            <div>Boot Mode:</div> <div style="color:white;">UEFI</div>
                            <div>Secure Boot:</div> <div style="color:#22c55e;">Enabled</div>
                            <div>Fast Boot:</div> <div style="color:white;">Enabled</div>
                        </div>

                        <!-- Boot Option Priority -->
                        <div style="color:var(--bios-amber); font-weight:bold; margin-bottom:15px; font-size:14px;">Boot Option Priority</div>
                        <div style="border:1px solid rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; background:rgba(0,0,0,0.3);">
                            ${s.bootOrder.map((device, i) => `
                                <div style="display:flex; align-items:center; padding:10px; font-size:13px; cursor:pointer; background:${i === s.biosSelectedIdx ? 'var(--bios-highlight)' : 'transparent'}; color:${i === s.biosSelectedIdx ? 'white' : 'inherit'};" onclick="simulator.setState({biosSelectedIdx:${i}})">
                                    <span style="width:30px; font-weight:bold;">${i+1}.</span>
                                    <span style="color:${device.enabled ? '#22c55e' : '#666'}; margin-right:10px; font-size:18px;">${device.enabled ? '●' : '○'}</span>
                                    <span style="flex:1; font-weight:bold; opacity:${device.enabled ? 1 : 0.6};">${device.label}</span>
                                    <span style="font-size:10px; background:${device.enabled ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)'}; color:${device.enabled ? '#22c55e' : '#666'}; padding:2px 8px; border-radius:4px; font-weight:bold;">${device.enabled ? 'ENABLED' : 'DISABLED'}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Footer Buttons -->
                        <div style="margin-top:25px; display:flex; gap:10px;">
                            <button class="win-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--bios-amber); font-size:11px; padding:6px 15px;" onclick="simulator.moveBootItem('up')">▲ Move Up</button>
                            <button class="win-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--bios-amber); font-size:11px; padding:6px 15px;" onclick="simulator.moveBootItem('down')">▼ Move Down</button>
                            <button class="win-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--bios-amber); font-size:11px; padding:6px 15px;" onclick="simulator.toggleDevice()">✕ Disable/Enable</button>
                        </div>
                    </div>

                    <div class="bios-setup-sidebar" style="width:280px; background:rgba(0,0,0,0.2); padding:20px; border-left:1px solid rgba(255,255,255,0.1);">
                        <div style="color:var(--bios-amber); font-weight:bold; margin-bottom:15px; font-size:14px;">Keyboard Controls</div>
                        <div style="line-height:2.2; font-size:13px; color:#aaa;">
                            <span style="color:var(--bios-amber);">← →</span> : Select Tab<br>
                            <span style="color:var(--bios-amber);">↑ ↓</span> : Select Item<br>
                            <span style="color:var(--bios-amber);">Enter</span> : Select/Change<br>
                            <span style="color:var(--bios-amber);">Space</span> : Enable/Disable<br>
                            <span style="color:var(--bios-amber);">ESC</span> : Exit
                        </div>

                        <div style="margin-top:40px;">
                            <div style="color:var(--bios-amber); font-weight:bold; margin-bottom:15px; font-size:14px;">Boot Device Info</div>
                            <div style="line-height:2; font-size:13px; color:#aaa;">
                                Type: <span style="color:var(--bios-amber);">${selectedDevice?.type || 'Unknown'}</span><br>
                                Status: <span style="color:var(--bios-amber);">${selectedDevice?.enabled ? 'Active' : 'Disabled'}</span><br>
                                Priority: <span style="color:var(--bios-amber);">#${s.biosSelectedIdx + 1}</span>
                            </div>
                        </div>

                        <div class="edu-hint" style="margin-top:40px; padding:10px; border-right:2px solid var(--bios-amber); background:rgba(255,176,0,0.05);" dir="rtl">
                            <div style="color:var(--bios-amber); font-weight:bold; font-size:12px; margin-bottom:5px;">💡 مهمة الطالب</div>
                            <p style="font-size:11px; margin:0;">اجعل <strong>USB Device</strong> في الترتيب رقم 1 لتبدأ عملية التثبيت.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDiskSetup() {
        const s = this.state;
        const selectedDisk = s.disks.find(d => d.id === s.selectedDiskId);
        
        return `
            <div class="win-setup-screen" style="align-items:stretch; text-align:left;" dir="ltr">
                <h1 style="font-size:22px; font-weight:300; margin-bottom:30px;">Where do you want to install Windows?</h1>
                
                <div class="disk-table-container">
                    <table class="disk-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Total Size</th>
                                <th>Free Space</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${s.disks.map(disk => `
                                <tr class="disk-row ${s.selectedDiskId === disk.id ? 'selected' : ''}" onclick="simulator.setState({selectedDiskId:${disk.id}})">
                                    <td>${disk.isPartition ? '🗄️' : '💿'} ${disk.name}</td>
                                    <td>${disk.size}</td>
                                    <td>${disk.isPartition && disk.type.includes('Formatted') ? disk.size : '0 MB'}</td>
                                    <td>${disk.type}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="display:flex; gap:10px; margin-bottom:30px;">
                    <button class="win-btn" style="background:transparent; color:white; border:1px solid rgba(255,255,255,0.2); font-size:12px; padding:5px 15px;" onclick="simulator.handleDelete()">Delete</button>
                    <button class="win-btn" style="background:transparent; color:white; border:1px solid rgba(255,255,255,0.2); font-size:12px; padding:5px 15px;" onclick="simulator.handleFormat()">Format</button>
                    <button class="win-btn" style="background:transparent; color:white; border:1px solid rgba(255,255,255,0.2); font-size:12px; padding:5px 15px;" onclick="simulator.handleCreatePartition(524288)">New</button>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button class="win-btn" ${!selectedDisk?.type.includes('Formatted') ? 'disabled' : ''} onclick="simulator.startInstallation()">Next</button>
                </div>

                <div class="edu-hint" style="text-align:right;" dir="rtl">
                    <div class="edu-hint-title">💡 تمرين عملي: إدارة الأقراص</div>
                    <p>القرص الجديد يحتاج لـ <strong>التهيئة (Format)</strong> قبل استخدامه. إذا كان القرص فارغاً تماماً (Unallocated)، اضغط على <strong>جديد (New)</strong> لإنشاء أقسام (Partitions) أولاً.</p>
                </div>
            </div>
        `;
    }

    moveBootItem(direction) {
        const idx = this.state.biosSelectedIdx;
        const items = [...this.state.bootOrder];
        if (direction === 'up' && idx > 0) {
            [items[idx], items[idx-1]] = [items[idx-1], items[idx]];
            this.setState({ bootOrder: items, biosSelectedIdx: idx - 1 });
        } else if (direction === 'down' && idx < items.length - 1) {
            [items[idx], items[idx+1]] = [items[idx+1], items[idx]];
            this.setState({ bootOrder: items, biosSelectedIdx: idx + 1 });
        }
    }

    handleDelete() {
        if (this.state.selectedDiskId === null) return;
        this.setState({
            disks: [{ id: 0, name: 'Drive 0 Unallocated Space', size: '512 GB', sizeMB: 524288, type: 'Unallocated', isPartition: false }],
            selectedDiskId: 0
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    }

    updateClock() {
        const el = document.getElementById('desktop-clock');
        if (el) {
            el.innerHTML = `
                <div>${this.formatTime(this.state.desktopTime)}</div>
                <div>${this.formatDate(this.state.desktopTime)}</div>
            `;
        }
    }

    toggleDevice() {
        const items = [...this.state.bootOrder];
        const idx = this.state.biosSelectedIdx;
        items[idx].enabled = !items[idx].enabled;
        this.setState({ bootOrder: items });
    }

    addKeyboardListeners() {
        // Remove existing listener if any (to avoid duplicates when re-initializing)
        if (window._win11SimKeyListener) {
            window.removeEventListener('keydown', window._win11SimKeyListener);
        }

        window._win11SimKeyListener = (e) => {
            // Only handle keys if this simulator is the active one
            if (window.simulator !== this) return;
            
            if (this.state.step === 'BIOS_SETUP') {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.state.biosSelectedIdx > 0) {
                        this.setState({ biosSelectedIdx: this.state.biosSelectedIdx - 1 });
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.state.biosSelectedIdx < this.state.bootOrder.length - 1) {
                        this.setState({ biosSelectedIdx: this.state.biosSelectedIdx + 1 });
                    }
                } else if (e.key === '+' || e.key === '=' || e.key === 'F6') {
                    e.preventDefault();
                    this.moveBootItem('up');
                } else if (e.key === '-' || e.key === '_' || e.key === 'F5') {
                    e.preventDefault();
                    this.moveBootItem('down');
                } else if (e.key === ' ' || e.code === 'Space') {
                    e.preventDefault();
                    this.toggleDevice();
                } else if (e.key === 'F10') {
                    e.preventDefault();
                    this.setState({ step: 'BOOT_BIOS', biosLines: [] });
                    this.startBootSequence();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.setState({ step: 'BOOT_BIOS', biosLines: [] });
                    this.startBootSequence();
                }
            }
        };

        window.addEventListener('keydown', window._win11SimKeyListener);
    }
}

// Global instance helper
function initSimulator() {
    if (!window.simulator) {
        window.simulator = new Win11Simulator('win11SimulatorContainer');
    } else {
        // Reset state if already exists
        window.simulator.setState({
            step: 'BOOT_BIOS',
            biosLines: [],
            isWindowsInstalled: false,
            isSetupDone: false,
            biosSelectedIdx: 0,
            installPercent: 0,
            selectedDiskId: null,
            disks: [
                { id: 0, name: 'Drive 0 Unallocated Space', size: '512 GB', sizeMB: 524288, type: 'Unallocated', isPartition: false }
            ],
            bootOrder: [
                { id: 'nvme', label: 'NVMe SSD: SAMSUNG MZVL2512HDJD', type: 'NVMe', enabled: true },
                { id: 'usb', label: 'USB Device: Kingston DataTraveler', type: 'USB', enabled: true },
                { id: 'sata', label: 'SATA HDD: WD Blue 1TB', type: 'SATA', enabled: true }
            ]
        });
        window.simulator.startBootSequence();
    }
}
