import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    const pcInventory = document.getElementById('pcInventory');
    const viewport = document.getElementById('pc3dViewport');
    const statusText = document.getElementById('pcSimStatus');
    const resetBtn = document.getElementById('pcSimResetBtn');
    const saveBtn = document.getElementById('pcSimSaveBtn');
    const infoTitle = document.getElementById('pcInfoTitle');
    const infoDesc = document.getElementById('pcInfoDesc');
    const infoSpecs = document.getElementById('pcInfoSpecs');
    const stepsList = document.getElementById('pcStepsList');
    const errorList = document.getElementById('pcErrorList');
    const savedBuilds = document.getElementById('pcSavedBuilds');

    if (!pcInventory || !viewport || !statusText || !resetBtn || !saveBtn || !infoTitle || !infoDesc || !infoSpecs || !stepsList || !errorList || !savedBuilds) return;

    const parts = [
        {
            id: 'psu',
            name: 'مزود الطاقة (PSU)',
            icon: 'plug',
            requires: [],
            category: 'Power',
            details: {
                function: 'يوفر الطاقة المستقرة لجميع المكونات.',
                specs: { wattage: '650W', efficiency: '80+ Bronze', formFactor: 'ATX' }
            }
        },
        {
            id: 'motherboard',
            name: 'اللوحة الأم (Motherboard)',
            icon: 'circuitry',
            requires: [],
            category: 'Board',
            details: {
                function: 'اللوحة الرئيسية التي تربط جميع القطع وتحدد التوافق.',
                specs: { socket: 'AM4', chipset: 'B550', ramType: 'DDR4', pcie: 'PCIe 4.0' }
            }
        },
        {
            id: 'cpu',
            name: 'المعالج (CPU)',
            icon: 'cpu',
            requires: ['motherboard'],
            category: 'Compute',
            details: {
                function: 'ينفذ التعليمات ويعالج العمليات الحسابية والمنطقية.',
                specs: { model: 'Ryzen 5 5600X', socket: 'AM4', cores: '6/12', tdp: '65W' }
            }
        },
        {
            id: 'ram',
            name: 'الذاكرة (RAM)',
            icon: 'memory',
            requires: ['motherboard'],
            category: 'Memory',
            details: {
                function: 'تخزين مؤقت سريع للبيانات أثناء تشغيل البرامج.',
                specs: { capacity: '16GB (2x8)', speed: '3200MHz', type: 'DDR4' }
            }
        },
        {
            id: 'gpu',
            name: 'بطاقة الرسوميات (GPU)',
            icon: 'video-camera',
            requires: ['motherboard', 'psu'],
            category: 'Graphics',
            details: {
                function: 'معالجة الرسوميات وتسريع التطبيقات ثلاثية الأبعاد.',
                specs: { model: 'RTX 3060', length: '242mm', slot: 'PCIe x16', power: '170W' }
            }
        },
        {
            id: 'storage',
            name: 'التخزين (NVMe SSD)',
            icon: 'hard-drive',
            requires: ['motherboard'],
            category: 'Storage',
            details: {
                function: 'تخزين نظام التشغيل والملفات بسرعة عالية.',
                specs: { type: 'NVMe M.2', capacity: '1TB', readSpeed: '3500MB/s' }
            }
        }
    ];

    const stepOrder = ['psu', 'motherboard', 'cpu', 'ram', 'storage', 'gpu'];
    const maxGpuLengthMm = 300;
    const storageKey = 'pc-sim-saved-builds-v1';
    const installedParts = new Set();
    const meshByPart = new Map();
    const pickable = [];
    let selectedPartId = null;
    const gltfLoader = new GLTFLoader();
    const modelStatus = { usingFallback: false };

    const slotTransforms = {
        motherboard: { position: new THREE.Vector3(-1.45, 2.1, 0.35), rotation: new THREE.Euler(0, Math.PI / 2, 0), scale: 1 },
        cpu: { position: new THREE.Vector3(-1.26, 2.44, 0.42), rotation: new THREE.Euler(0, Math.PI / 2, 0), scale: 1 },
        ram: { position: new THREE.Vector3(-1.28, 2.18, -0.08), rotation: new THREE.Euler(0, Math.PI / 2, 0), scale: 1 },
        gpu: { position: new THREE.Vector3(-0.25, 1.82, 0.02), rotation: new THREE.Euler(0, 0, 0), scale: 1 },
        psu: { position: new THREE.Vector3(1.8, 0.73, 0), rotation: new THREE.Euler(0, 0, 0), scale: 1 },
        storage: { position: new THREE.Vector3(1.7, 1.85, -0.58), rotation: new THREE.Euler(0, 0, 0), scale: 1 }
    };

    const spawnTransforms = {
        motherboard: { position: new THREE.Vector3(3.6, 3.2, 2.8), rotation: new THREE.Euler(0.2, -0.6, 0.1), scale: 0.92 },
        cpu: { position: new THREE.Vector3(3.3, 3.1, 2.5), rotation: new THREE.Euler(0.1, -0.5, 0.2), scale: 0.9 },
        ram: { position: new THREE.Vector3(3.5, 3.0, 2.2), rotation: new THREE.Euler(0.05, -0.45, 0.16), scale: 0.95 },
        gpu: { position: new THREE.Vector3(3.8, 2.6, 2.5), rotation: new THREE.Euler(0.15, -0.55, 0.08), scale: 0.9 },
        psu: { position: new THREE.Vector3(3.6, 2.5, 2.8), rotation: new THREE.Euler(0.1, -0.55, 0.1), scale: 0.92 },
        storage: { position: new THREE.Vector3(3.4, 2.8, 2.4), rotation: new THREE.Euler(0.2, -0.5, 0.1), scale: 0.95 }
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    viewport.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 4.5;
    controls.maxDistance = 11;
    controls.target.set(0, 1.1, 0);

    camera.position.set(4.6, 3.6, 5.2);
    camera.lookAt(0, 1.1, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 6, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.35);
    fillLight.position.set(-4, 3, -3);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(12, 22, 0x334155, 0x1e293b);
    grid.position.y = -0.02;
    scene.add(grid);

    const caseGroup = new THREE.Group();
    scene.add(caseGroup);

    const caseBody = new THREE.Mesh(
        new THREE.BoxGeometry(5.8, 3.8, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.45, roughness: 0.62 })
    );
    caseBody.position.set(0, 1.9, 0);
    caseGroup.add(caseBody);

    const glassSide = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 3.4, 1.9),
        new THREE.MeshPhysicalMaterial({
            color: 0x7dd3fc,
            transmission: 0.8,
            transparent: true,
            opacity: 0.28,
            roughness: 0.15
        })
    );
    glassSide.position.set(-2.88, 2, 0);
    caseGroup.add(glassSide);

    const insidePlate = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 3.2, 1.85),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.85 })
    );
    insidePlate.position.set(0, 1.95, 0);
    caseGroup.add(insidePlate);

    function partById(partId) {
        return parts.find((p) => p.id === partId);
    }

    function collectErrors() {
        const errors = [];
        if (installedParts.has('cpu') && installedParts.has('motherboard')) {
            const cpu = partById('cpu');
            const mb = partById('motherboard');
            if (cpu.details.specs.socket !== mb.details.specs.socket) {
                errors.push('عدم توافق بين مقبس المعالج ومقبس اللوحة الأم.');
            }
        }

        if (installedParts.has('ram') && installedParts.has('motherboard')) {
            const ram = partById('ram');
            const mb = partById('motherboard');
            if (ram.details.specs.type !== mb.details.specs.ramType) {
                errors.push('نوع الذاكرة غير متوافق مع اللوحة الأم.');
            }
        }

        if (installedParts.has('gpu')) {
            const gpuLength = Number.parseInt(partById('gpu').details.specs.length, 10) || 0;
            if (gpuLength > maxGpuLengthMm) {
                errors.push('طول بطاقة الرسوميات أكبر من المساحة المتاحة داخل الكيس.');
            }
            if (!installedParts.has('psu')) {
                errors.push('بطاقة الرسوميات تحتاج مزود طاقة مركبا أولاً.');
            }
        }

        return errors;
    }

    function parseWatt(text) {
        const value = Number.parseInt(text, 10);
        return Number.isNaN(value) ? 0 : value;
    }

    function totalPowerNeed() {
        let total = 120;
        if (installedParts.has('cpu')) total += parseWatt(partById('cpu').details.specs.tdp);
        if (installedParts.has('gpu')) total += parseWatt(partById('gpu').details.specs.power);
        return total;
    }

    function createPartMesh(partId) {
        const group = new THREE.Group();
        group.userData.partId = partId;

        if (partId === 'motherboard') {
            const board = new THREE.Mesh(
                new THREE.BoxGeometry(2.55, 1.85, 0.08),
                new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6, metalness: 0.2 })
            );
            board.rotation.y = Math.PI / 2;
            board.position.set(-1.45, 2.1, 0.35);
            group.add(board);

            for (let i = 0; i < 3; i += 1) {
                const slot = new THREE.Mesh(
                    new THREE.BoxGeometry(0.18, 1.45, 0.06),
                    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
                );
                slot.rotation.y = Math.PI / 2;
                slot.position.set(-1.35, 2.08, -0.45 + i * 0.45);
                group.add(slot);
            }
        }

        if (partId === 'cpu') {
            const cpu = new THREE.Mesh(
                new THREE.BoxGeometry(0.52, 0.52, 0.08),
                new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.35 })
            );
            cpu.rotation.y = Math.PI / 2;
            cpu.position.set(-1.36, 2.45, 0.42);
            group.add(cpu);

            const cooler = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.28, 0.22, 18),
                new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.4, roughness: 0.55 })
            );
            cooler.rotation.y = Math.PI / 2;
            cooler.position.set(-1.25, 2.45, 0.42);
            group.add(cooler);
        }

        if (partId === 'ram') {
            const ramMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.4, roughness: 0.35 });
            const ram1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.24), ramMat);
            const ram2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.24), ramMat);
            ram1.rotation.y = Math.PI / 2;
            ram2.rotation.y = Math.PI / 2;
            ram1.position.set(-1.28, 2.18, -0.18);
            ram2.position.set(-1.28, 2.18, 0.02);
            group.add(ram1, ram2);
        }

        if (partId === 'gpu') {
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(1.7, 0.48, 0.55),
                new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.65, roughness: 0.4 })
            );
            body.position.set(-0.25, 1.82, 0.02);
            group.add(body);

            const fan1 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20),
                new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.5 })
            );
            const fan2 = fan1.clone();
            fan1.rotation.z = Math.PI / 2;
            fan2.rotation.z = Math.PI / 2;
            fan1.position.set(-0.65, 1.82, 0.02);
            fan2.position.set(0.12, 1.82, 0.02);
            group.add(fan1, fan2);

            const backPlate = new THREE.Mesh(
                new THREE.BoxGeometry(1.72, 0.52, 0.04),
                new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.55, roughness: 0.35 })
            );
            backPlate.position.set(-0.25, 1.82, -0.29);
            group.add(backPlate);
        }

        if (partId === 'psu') {
            const psu = new THREE.Mesh(
                new THREE.BoxGeometry(1.15, 0.9, 1.55),
                new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.55, roughness: 0.45 })
            );
            psu.position.set(1.8, 0.73, 0);
            group.add(psu);

            const fan = new THREE.Mesh(
                new THREE.CylinderGeometry(0.34, 0.34, 0.03, 24),
                new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.25, roughness: 0.5 })
            );
            fan.rotation.x = Math.PI / 2;
            fan.position.set(1.23, 0.73, 0);
            group.add(fan);
        }

        if (partId === 'storage') {
            const ssd = new THREE.Mesh(
                new THREE.BoxGeometry(0.68, 0.12, 0.95),
                new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.35 })
            );
            ssd.position.set(1.7, 1.85, -0.58);
            group.add(ssd);
        }

        group.traverse((node) => {
            if (node.isMesh) {
                node.userData.partId = partId;
                node.userData.originalEmissive = node.material?.emissive ? node.material.emissive.getHex() : 0x000000;
                pickable.push(node);
            }
        });

        return group;
    }

    function loadModel(url) {
        return new Promise((resolve, reject) => {
            gltfLoader.load(url, resolve, undefined, reject);
        });
    }

    async function createPartObject(partId) {
        const base = createPartMesh(partId);
        const candidates = [
            `assets/models/pc/${partId}.glb`,
            `assets/models/pc/${partId}.gltf`,
            `models/pc/${partId}.glb`,
            `models/pc/${partId}.gltf`
        ];

        for (const path of candidates) {
            try {
                const gltf = await loadModel(path);
                const root = gltf.scene || gltf.scenes?.[0];
                if (!root) continue;
                const group = new THREE.Group();
                group.userData.partId = partId;
                root.traverse((node) => {
                    if (!node.isMesh) return;
                    node.castShadow = true;
                    node.receiveShadow = true;
                    node.userData.partId = partId;
                    if (node.material && node.material.emissive) {
                        node.userData.originalEmissive = node.material.emissive.getHex();
                    }
                    pickable.push(node);
                });
                group.add(root);

                const box = new THREE.Box3().setFromObject(group);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const targetSize = partId === 'motherboard' ? 2.4 : (partId === 'gpu' ? 1.9 : 1.1);
                const scale = targetSize / maxDim;
                group.scale.setScalar(scale);

                return group;
            } catch {
                // try next path
            }
        }

        modelStatus.usingFallback = true;
        return base;
    }

    function animateSnap(group, partId) {
        const start = performance.now();
        const duration = 580;
        const fromPos = group.position.clone();
        const fromQuat = group.quaternion.clone();
        const fromScale = group.scale.clone();
        const to = slotTransforms[partId];
        const toQuat = new THREE.Quaternion().setFromEuler(to.rotation);
        const toScale = new THREE.Vector3(to.scale, to.scale, to.scale);

        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const e = 1 - ((1 - t) * (1 - t) * (1 - t));
            group.position.lerpVectors(fromPos, to.position, e);
            group.quaternion.copy(fromQuat).slerp(toQuat, e);
            group.scale.lerpVectors(fromScale, toScale, e);
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function setSelectedPart(partId) {
        selectedPartId = partId;
        const part = partById(partId);
        if (!part) return;

        infoTitle.textContent = part.name;
        infoDesc.textContent = part.details.function;
        infoSpecs.innerHTML = '';
        Object.entries(part.details.specs).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'pc-spec-row';
            row.innerHTML = `<span>${key}</span><strong>${value}</strong>`;
            infoSpecs.appendChild(row);
        });
    }

    function refreshSelectionVisuals() {
        document.querySelectorAll('.pc-part-item').forEach((el) => {
            if (el.getAttribute('data-part-id') === selectedPartId) {
                el.classList.add('is-selected');
            } else {
                el.classList.remove('is-selected');
            }
        });

        pickable.forEach((mesh) => {
            if (!mesh.material || !mesh.material.emissive) return;
            if (mesh.userData.partId === selectedPartId && installedParts.has(selectedPartId)) {
                mesh.material.emissive.setHex(0x0ea5e9);
                mesh.material.emissiveIntensity = 0.45;
            } else {
                mesh.material.emissive.setHex(mesh.userData.originalEmissive || 0x000000);
                mesh.material.emissiveIntensity = 0.1;
            }
        });
    }

    async function installPart(partId) {
        if (installedParts.has(partId)) return;
        installedParts.add(partId);
        const mesh = await createPartObject(partId);
        const spawn = spawnTransforms[partId] || slotTransforms[partId];
        mesh.position.copy(spawn.position);
        mesh.rotation.copy(spawn.rotation);
        mesh.scale.setScalar(spawn.scale);
        meshByPart.set(partId, mesh);
        scene.add(mesh);
        animateSnap(mesh, partId);
        setSelectedPart(partId);
        updateUI();
    }

    function uninstallPart(partId) {
        const dependents = parts.filter((p) => p.requires.includes(partId)).map((p) => p.id);
        dependents.forEach((depId) => {
            if (installedParts.has(depId)) uninstallPart(depId);
        });

        installedParts.delete(partId);
        const mesh = meshByPart.get(partId);
        if (mesh) {
            scene.remove(mesh);
            meshByPart.delete(partId);
        }
        updateUI();
    }

    function renderSteps() {
        stepsList.innerHTML = '';
        const firstPending = stepOrder.find((id) => !installedParts.has(id));
        stepOrder.forEach((id, idx) => {
            const li = document.createElement('li');
            li.textContent = `${idx + 1}. ${partById(id).name}`;
            if (installedParts.has(id)) li.classList.add('is-done');
            if (id === firstPending) li.classList.add('is-current');
            stepsList.appendChild(li);
        });
    }

    function renderErrors() {
        const errors = collectErrors();
        const psu = partById('psu');
        const psuWatt = parseWatt(psu.details.specs.wattage);
        const needed = totalPowerNeed();
        if (psuWatt > 0 && needed > psuWatt) {
            errors.push(`القدرة المطلوبة (${needed}W) أعلى من قدرة مزود الطاقة (${psuWatt}W).`);
        }

        errorList.innerHTML = '';
        if (errors.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'لا توجد أخطاء توافق حالياً.';
            li.style.color = 'var(--success-color)';
            errorList.appendChild(li);
            return;
        }
        errors.forEach((err) => {
            const li = document.createElement('li');
            li.textContent = err;
            errorList.appendChild(li);
        });

        if (modelStatus.usingFallback) {
            const li = document.createElement('li');
            li.textContent = 'ملاحظة: بعض النماذج الحقيقية غير موجودة، تم استخدام نماذج بديلة مؤقتة.';
            li.style.color = 'var(--warning-color)';
            errorList.appendChild(li);
        }
    }

    function updateStatus() {
        if (installedParts.size === 0) {
            statusText.textContent = 'في انتظار تركيب القطع داخل النموذج ثلاثي الأبعاد...';
            statusText.style.color = 'var(--text-muted)';
            return;
        }

        if (installedParts.size === parts.length) {
            statusText.textContent = 'تم تجميع الحاسوب بالكامل بنجاح (3D)';
            statusText.style.color = 'var(--success-color)';
            return;
        }

        statusText.textContent = `تم تركيب ${installedParts.size} من ${parts.length} قطع`;
        statusText.style.color = 'var(--primary-color)';
    }

    function loadSavedBuilds() {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function persistSavedBuilds(builds) {
        localStorage.setItem(storageKey, JSON.stringify(builds.slice(0, 6)));
    }

    function renderSavedBuilds() {
        const builds = loadSavedBuilds();
        savedBuilds.innerHTML = '';
        if (builds.length === 0) {
            savedBuilds.innerHTML = '<p class="lab-note">لا توجد تجميعات محفوظة بعد.</p>';
            return;
        }

        builds.forEach((build, idx) => {
            const item = document.createElement('div');
            item.className = 'pc-saved-item';
            item.innerHTML = `
                <span>${build.name}</span>
                <button type="button" data-load-build="${idx}">استعراض</button>
            `;
            savedBuilds.appendChild(item);
        });
    }

    function applyBuild(partIds) {
        Array.from(installedParts).forEach((id) => uninstallPart(id));
        stepOrder.forEach((id) => {
            if (partIds.includes(id)) installPart(id);
        });
        updateUI();
    }

    function updateInventory() {
        pcInventory.innerHTML = '';

        parts.forEach((part) => {
            const isInstalled = installedParts.has(part.id);
            const canInstall = part.requires.every((dep) => installedParts.has(dep));

            const item = document.createElement('div');
            item.className = `pc-part-item ${canInstall ? '' : 'disabled'}`;
            item.setAttribute('data-part-id', part.id);
            item.innerHTML = `
                <i class="ph ph-${part.icon} part-icon"></i>
                <span>${part.name}</span>
                ${isInstalled
                    ? '<i class="ph ph-x-circle remove-btn" title="إزالة"></i>'
                    : (!canInstall
                        ? '<i class="ph ph-lock-key lock-icon"></i>'
                        : '<i class="ph ph-plus-circle add-icon"></i>')}
            `;

            if (isInstalled) {
                item.addEventListener('click', () => uninstallPart(part.id));
            } else if (canInstall) {
                item.addEventListener('click', () => installPart(part.id));
            } else {
                item.title = `يجب تركيب ${part.requires.join(' و ')} أولاً`;
            }
            item.addEventListener('mouseenter', () => setSelectedPart(part.id));

            pcInventory.appendChild(item);
        });
    }

    function updateUI() {
        updateInventory();
        updateStatus();
        renderSteps();
        renderErrors();
        renderSavedBuilds();
        refreshSelectionVisuals();
    }

    function resizeRenderer() {
        const width = viewport.clientWidth || 640;
        const height = viewport.clientHeight || 520;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(viewport);
    window.addEventListener('resize', resizeRenderer);
    resizeRenderer();

    resetBtn.addEventListener('click', () => {
        Array.from(installedParts).forEach((id) => uninstallPart(id));
        updateUI();
    });

    saveBtn.addEventListener('click', () => {
        const current = stepOrder.filter((id) => installedParts.has(id));
        if (current.length === 0) {
            statusText.textContent = 'لا يمكن الحفظ قبل تركيب أي قطعة.';
            statusText.style.color = 'var(--warning-color)';
            return;
        }
        const builds = loadSavedBuilds();
        const stamp = new Date().toLocaleString('ar-DZ');
        builds.unshift({ name: `تجميعة (${current.length} قطع) - ${stamp}`, parts: current });
        persistSavedBuilds(builds);
        updateUI();
        statusText.textContent = 'تم حفظ التجميعة الحالية.';
        statusText.style.color = 'var(--success-color)';
    });

    savedBuilds.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const idx = target.getAttribute('data-load-build');
        if (idx === null) return;
        const builds = loadSavedBuilds();
        const build = builds[Number(idx)];
        if (!build) return;
        applyBuild(build.parts || []);
        statusText.textContent = `تم استعراض: ${build.name}`;
        statusText.style.color = 'var(--primary-color)';
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    renderer.domElement.addEventListener('pointerdown', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(pickable, false);
        if (hits.length === 0) return;
        const partId = hits[0].object.userData.partId;
        if (!partId) return;
        setSelectedPart(partId);
        refreshSelectionVisuals();
    });

    function animate() {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    setSelectedPart('motherboard');
    updateUI();
    animate();
});
