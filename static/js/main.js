// static/js/main.js
window.addEventListener('load', init);

// Variabel global
let scene, camera, renderer, controls;
let clock = new THREE.Clock();
let water, waterGeometry, waterMaterial;
let buildings = [];
let lights = [];
let stats;
let gui;
let isLoading = true;
let keyState = {};

// Parameter untuk dimanipulasi dengan GUI
let params = {
    waterColor: 0x0077be,
    waterOpacity: 0.8,
    waterScale: 1.0,
    waterSpeed: 1.0,
    sunlightIntensity: 1.0,
    fogDensity: 0.02,
    ambientIntensity: 0.5
};

function init() {
    // Inisialisasi Three.js
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0077be, params.fogDensity);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 20, 50);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // Stats untuk performa
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    document.body.appendChild(stats.domElement);
    
    // Controls
    controls = new THREE.PointerLockControls(camera, document.body);
    
    document.addEventListener('click', function() {
        controls.lock();
    });
    
    document.addEventListener('keydown', function(event) {
        keyState[event.code] = true;
    });
    
    document.addEventListener('keyup', function(event) {
        keyState[event.code] = false;
    });

    // Buat GUI
    createGUI();
    
    // Tambahkan elemen ke scene
    createLights();
    createWater();
    createSeabed();
    createAtlantisCityRuins();
    createUnderwaterEnvironment();
    
    // Menangani resize window
    window.addEventListener('resize', onWindowResize);
    
    // Mulai loop animasi
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        isLoading = false;
    }, 3000);
    
    animate();
}

function createGUI() {
    gui = new dat.GUI();
    
    const waterFolder = gui.addFolder('Water');
    waterFolder.addColor(params, 'waterColor').onChange(function(value) {
        waterMaterial.color.set(value);
    });
    waterFolder.add(params, 'waterOpacity', 0, 1).onChange(function(value) {
        waterMaterial.opacity = value;
    });
    waterFolder.add(params, 'waterScale', 0.1, 2).onChange(function(value) {
        waterMaterial.scale = value;
    });
    waterFolder.add(params, 'waterSpeed', 0.1, 3).onChange(function(value) {
        // Update water speed
    });
    waterFolder.open();
    
    const lightingFolder = gui.addFolder('Lighting');
    lightingFolder.add(params, 'sunlightIntensity', 0, 2).onChange(function(value) {
        lights[0].intensity = value;
    });
    lightingFolder.add(params, 'ambientIntensity', 0, 1).onChange(function(value) {
        lights[1].intensity = value;
    });
    lightingFolder.add(params, 'fogDensity', 0, 0.1).onChange(function(value) {
        scene.fog.density = value;
    });
    lightingFolder.open();
}

function createLights() {
    // Cahaya matahari yang menembus air
    const sunlight = new THREE.DirectionalLight(0xffffff, params.sunlightIntensity);
    sunlight.position.set(50, 100, 50);
    sunlight.castShadow = true;
    
    // Konfigurasi shadow
    sunlight.shadow.mapSize.width = 2048;
    sunlight.shadow.mapSize.height = 2048;
    sunlight.shadow.camera.near = 0.5;
    sunlight.shadow.camera.far = 500;
    sunlight.shadow.camera.left = -100;
    sunlight.shadow.camera.right = 100;
    sunlight.shadow.camera.top = 100;
    sunlight.shadow.camera.bottom = -100;
    
    scene.add(sunlight);
    lights.push(sunlight);
    
    // Cahaya ambient untuk efek kedalaman air
    const ambient = new THREE.AmbientLight(0x0077be, params.ambientIntensity);
    scene.add(ambient);
    lights.push(ambient);
    
    // Beberapa point light untuk bangunan Atlantis
    for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        
        const pointLight = new THREE.PointLight(0x4cc9f0, 1, 50);
        pointLight.position.set(x, 5, z);
        scene.add(pointLight);
        lights.push(pointLight);
        
        // Helper untuk melihat posisi light (dimatikan pada produksi)
        // const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
        // scene.add(pointLightHelper);
    }
}

function createWater() {
    // Membuat material water yang bergerak
    waterGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    
    // Tekstur untuk shader water
    const waterTexture = new THREE.TextureLoader();
    
    // Membuat material untuk air
    waterMaterial = new THREE.MeshPhongMaterial({
        color: params.waterColor,
        transparent: true,
        opacity: params.waterOpacity,
        side: THREE.DoubleSide
    });
    
    // Membuat mesh untuk air
    water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 30;
    scene.add(water);
}

function createSeabed() {
    // Geometry untuk dasar laut
    const seabedGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    
    // Material untuk dasar laut
    const seabedMaterial = new THREE.MeshPhongMaterial({
        color: 0x654321,
        side: THREE.DoubleSide,
        wireframe: false
    });
    
    // Membuat bentuk dasar laut yang tidak rata
    for (let i = 0; i < seabedGeometry.vertices.length; i++) {
        // Membuat permukaan yang tidak rata dengan noise
        const vertex = seabedGeometry.vertices[i];
        const x = vertex.x / 30;
        const y = vertex.y / 30;
        vertex.z = (Math.sin(x) + Math.sin(y)) * 2;
    }
    
    seabedGeometry.verticesNeedUpdate = true;
    seabedGeometry.computeVertexNormals();
    
    // Membuat mesh untuk dasar laut
    const seabed = new THREE.Mesh(seabedGeometry, seabedMaterial);
    seabed.rotation.x = -Math.PI / 2;
    seabed.position.y = -50;
    seabed.receiveShadow = true;
    scene.add(seabed);
}

function createAtlantisCityRuins() {
    // Membuat kota Atlantis yang tenggelam
    
    // Bangunan-bangunan utama
    for (let i = 0; i < 50; i++) {
        createBuilding();
    }
    
    // Piramida besar di tengah
    createMainPyramid();
    
    // Patung-patung dan monumen
    createStatues();
    
    // Jalan-jalan dan struktur lainnya
    createRoads();
}

function createBuilding() {
    // Buat bangunan acak
    const size = Math.random() * 10 + 5;
    const height = Math.random() * 15 + 10;
    
    const buildingGeometry = new THREE.BoxGeometry(size, height, size);
    
    // Beberapa variasi material untuk bangunan
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0xD4AF37 }), // Gold
        new THREE.MeshPhongMaterial({ color: 0xC0C0C0 }), // Silver
        new THREE.MeshPhongMaterial({ color: 0xFFFFFF }), // White marble
        new THREE.MeshPhongMaterial({ color: 0x44944A })  // Green stone
    ];
    
    const building = new THREE.Mesh(
        buildingGeometry,
        materials[Math.floor(Math.random() * materials.length)]
    );
    
    // Posisi acak di radius 100
    const radius = Math.random() * 100;
    const angle = Math.random() * Math.PI * 2;
    
    building.position.x = Math.cos(angle) * radius;
    building.position.y = -height / 2;
    building.position.z = Math.sin(angle) * radius;
    
    // Rotasi acak
    building.rotation.y = Math.random() * Math.PI * 2;
    
    building.castShadow = true;
    building.receiveShadow = true;
    
    scene.add(building);
    buildings.push(building);
}

function createMainPyramid() {
    // Buat piramida utama
    const pyramidGeometry = new THREE.ConeGeometry(30, 40, 4);
    const pyramidMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.position.set(0, -20, 0);
    pyramid.castShadow = true;
    pyramid.receiveShadow = true;
    
    scene.add(pyramid);
    buildings.push(pyramid);
}

function createStatues() {
    // Beberapa patung di sekitar kota
    for (let i = 0; i < 10; i++) {
        // Buat patung sederhana (silinder sebagai tubuh)
        const bodyGeometry = new THREE.CylinderGeometry(1, 1, 5, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Buat kepala (bola)
        const headGeometry = new THREE.SphereGeometry(1, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3;
        
        // Grup untuk patung
        const statue = new THREE.Group();
        statue.add(body);
        statue.add(head);
        
        // Posisi acak di radius 80-150
        const radius = Math.random() * 70 + 80;
        const angle = Math.random() * Math.PI * 2;
        
        statue.position.x = Math.cos(angle) * radius;
        statue.position.y = -2.5;
        statue.position.z = Math.sin(angle) * radius;
        
        statue.castShadow = true;
        statue.receiveShadow = true;
        
        scene.add(statue);
    }
}

function createRoads() {
    // Buat jalan-jalan di kota
    for (let i = 0; i < 5; i++) {
        const roadGeometry = new THREE.PlaneGeometry(5, 100);
        const roadMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444444,
            side: THREE.DoubleSide
        });
        
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = Math.PI / 2;
        road.rotation.y = i * Math.PI / 5;
        road.position.y = -0.5;
        
        scene.add(road);
    }
    
    // Buat jalan melingkar
    const circleGeometry = new THREE.RingGeometry(45, 50, 64);
    const circleMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x444444,
        side: THREE.DoubleSide
    });
    
    const circleRoad = new THREE.Mesh(circleGeometry, circleMaterial);
    circleRoad.rotation.x = Math.PI / 2;
    circleRoad.position.y = -0.5;
    
    scene.add(circleRoad);
}

function createUnderwaterEnvironment() {
    // Buat berbagai objek bawah air seperti karang dan tanaman
    
    // Karang
    for (let i = 0; i < 100; i++) {
        const size = Math.random() * 3 + 1;
        const coralGeometry = new THREE.DodecahedronGeometry(size, 0);
        
        // Variasi warna untuk karang
        const colors = [0xFF5733, 0xC70039, 0x900C3F, 0x581845, 0xFF8D1A];
        const coralMaterial = new THREE.MeshPhongMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)]
        });
        
        const coral = new THREE.Mesh(coralGeometry, coralMaterial);
        
        // Posisi acak
        const radius = Math.random() * 200 + 100;
        const angle = Math.random() * Math.PI * 2;
        
        coral.position.x = Math.cos(angle) * radius;
        coral.position.y = -45 + Math.random() * 5;
        coral.position.z = Math.sin(angle) * radius;
        
        // Rotasi acak
        coral.rotation.x = Math.random() * Math.PI;
        coral.rotation.y = Math.random() * Math.PI;
        coral.rotation.z = Math.random() * Math.PI;
        
        coral.castShadow = true;
        
        scene.add(coral);
    }
    
    // Tanaman laut
    for (let i = 0; i < 200; i++) {
        const height = Math.random() * 5 + 3;
        const plantGeometry = new THREE.CylinderGeometry(0.5, 0.1, height, 8);
        
        // Variasi warna untuk tanaman
        const colors = [0x0B6623, 0x088F8F, 0x0FFF50, 0x50C878, 0x3CB371];
        const plantMaterial = new THREE.MeshPhongMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)]
        });
        
        const plant = new THREE.Mesh(plantGeometry, plantMaterial);
        
        // Posisi acak
        const radius = Math.random() * 200 + 50;
        const angle = Math.random() * Math.PI * 2;
        
        plant.position.x = Math.cos(angle) * radius;
        plant.position.y = -45 + height / 2;
        plant.position.z = Math.sin(angle) * radius;
        
        // Sedikit rotasi acak
        plant.rotation.x = (Math.random() - 0.5) * 0.2;
        plant.rotation.z = (Math.random() - 0.5) * 0.2;
        
        plant.castShadow = true;
        
        scene.add(plant);
    }
    
    // Ikan-ikan
    createFishes();
}

function createFishes() {
    // Buat gerombolan ikan
    for (let i = 0; i < 50; i++) {
        const fishGeometry = new THREE.ConeGeometry(1, 3, 8);
        
        // Variasi warna untuk ikan
        const colors = [0x4169E1, 0x6495ED, 0x00BFFF, 0x1E90FF, 0xADD8E6];
        const fishMaterial = new THREE.MeshPhongMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)]
        });
        
        const fish = new THREE.Mesh(fishGeometry, fishMaterial);
        
        // Posisi acak
        const radius = Math.random() * 100 + 50;
        const angle = Math.random() * Math.PI * 2;
        const height = Math.random() * 20 + 5;
        
        fish.position.x = Math.cos(angle) * radius;
        fish.position.y = height;
        fish.position.z = Math.sin(angle) * radius;
        
        // Rotasi untuk menghadap ke arah pusat
        fish.rotation.y = Math.atan2(fish.position.x, fish.position.z);
        
        scene.add(fish);
        
        // Animasi pergerakan ikan
        animateFish(fish);
    }
}

function animateFish(fish) {
    // Animasi pergerakan ikan dengan Tween.js
    const initialPosition = { x: fish.position.x, y: fish.position.y, z: fish.position.z };
    
    // Buat titik tujuan acak di sekitar posisi awal
    const targetX = initialPosition.x + (Math.random() - 0.5) * 20;
    const targetY = initialPosition.y + (Math.random() - 0.5) * 10;
    const targetZ = initialPosition.z + (Math.random() - 0.5) * 20;
    
    // Tween untuk pergerakan
    new TWEEN.Tween(fish.position)
        .to({ x: targetX, y: targetY, z: targetZ }, Math.random() * 5000 + 5000)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onComplete(function() {
            // Setelah sampai tujuan, kembali ke posisi awal
            new TWEEN.Tween(fish.position)
                .to(initialPosition, Math.random() * 5000 + 5000)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .onComplete(function() {
                    // Ulangi animasi
                    animateFish(fish);
                })
                .start();
                
            // Update rotasi untuk menghadap ke arah pergerakan
            fish.rotation.y = Math.atan2(initialPosition.x - fish.position.x, initialPosition.z - fish.position.z);
        })
        .start();
        
    // Update rotasi untuk menghadap ke arah pergerakan
    fish.rotation.y = Math.atan2(targetX - fish.position.x, targetZ - fish.position.z);
}

function onWindowResize() {
    // Update kamera dan renderer saat ukuran window berubah
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function moveCamera() {
    // Kecepatan pergerakan
    const speed = 0.5;
    
    // Pergerakan WASD
    if (keyState['KeyW']) {
        controls.moveForward(speed);
    }
    if (keyState['KeyS']) {
        controls.moveForward(-speed);
    }
    if (keyState['KeyA']) {
        controls.moveRight(-speed);
    }
    if (keyState['KeyD']) {
        controls.moveRight(speed);
    }
    
    // Pergerakan vertikal
    if (keyState['Space']) {
        camera.position.y += speed;
    }
    if (keyState['ShiftLeft']) {
        camera.position.y -= speed;
    }
}

function animateWater() {
    // Animasi air bergelombang
    if (waterGeometry && waterGeometry.vertices) {
        const time = clock.getElapsedTime() * params.waterSpeed;
        
        for (let i = 0; i < waterGeometry.vertices.length; i++) {
            const vertex = waterGeometry.vertices[i];
            const x = vertex.x / 30;
            const y = vertex.y / 30;
            vertex.z = Math.sin(x + time) * Math.cos(y + time) * 2;
        }
        
        waterGeometry.verticesNeedUpdate = true;
        waterGeometry.computeVertexNormals();
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (isLoading) return;
    
    TWEEN.update();
    stats.update();
    
    // Gerakan kontrol camera
    if (controls.isLocked) {
        moveCamera();
    }
    
    // Animasi air
    animateWater();
    
    // Render scene
    renderer.render(scene, camera);
}