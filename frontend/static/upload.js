class FileUploadComponent {
    constructor() {
        this.uploadBox = document.getElementById('uploadBox');
        this.fileInput = document.getElementById('fileInput');
        this.filesPreview = document.getElementById('filesPreview');
        this.filesList = document.getElementById('filesList');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.uploadComplete = document.getElementById('uploadComplete');
        this.addMoreBtn = document.getElementById('addMoreBtn');
        this.newUploadBtn = document.getElementById('newUploadBtn');
        this.viewFilesBtn = document.getElementById('viewFilesBtn');

        this.files = [];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.uploadBox.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        this.uploadBox.addEventListener('dragover', e => { e.preventDefault(); this.uploadBox.classList.add('dragover'); });
        this.uploadBox.addEventListener('dragleave', e => { e.preventDefault(); this.uploadBox.classList.remove('dragover'); });
        this.uploadBox.addEventListener('drop', e => { e.preventDefault(); this.uploadBox.classList.remove('dragover'); this.handleFiles(e.dataTransfer.files); });

        this.addMoreBtn.addEventListener('click', () => this.fileInput.click());
        this.newUploadBtn.addEventListener('click', () => this.startNewUpload());
        this.viewFilesBtn.addEventListener('click', () => this.viewDetectionResults());

        const selectBtn = document.querySelector('.upload-button');
        if(selectBtn) selectBtn.addEventListener('click', () => this.fileInput.click());
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList);
        newFiles.forEach(file => { if(this.validateFile(file)) this.addFile(file); });
        if(this.files.length > 0) { this.showPreview(); this.startRealUpload(); }
    }

    validateFile(file) {
        if(!this.allowedTypes.includes(file.type)) { alert(`${file.name}: Only JPG, PNG, GIF allowed.`); return false; }
        if(file.size > this.maxFileSize) { alert(`${file.name}: File too large.`); return false; }
        return true;
    }

    addFile(file) {
        const fileObj = { file, id: Date.now() + Math.random(), status: 'pending', annotated: null, resultId: null };
        this.files.push(fileObj);
        this.renderFile(fileObj);
    }

    renderFile(fileObj) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.setAttribute('data-file-id', fileObj.id);

        const reader = new FileReader();
        reader.onload = e => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'file-preview';
            img.style.width = '120px';
            img.style.borderRadius = '12px';
            fileElement.appendChild(img);
        };
        reader.readAsDataURL(fileObj.file);

        this.filesList.appendChild(fileElement);
    }

    showPreview() {
        this.filesPreview.classList.add('show');
        this.addMoreBtn.style.display = 'inline-block';
    }

    startRealUpload() {
        let uploaded = 0;
        const total = this.files.length;
        this.files.forEach((fileObj, index) => {
            setTimeout(() => {
                this.uploadFileToBackend(fileObj, () => {
                    uploaded++;
                    this.updateProgress((uploaded/total)*100);
                    if(uploaded === total) this.completeUpload();
                });
            }, index*300);
        });
    }

    uploadFileToBackend(fileObj, doneCallback) {
        const formData = new FormData();
        formData.append("image", fileObj.file);
        fetch("/api/detect/", { method: "POST", body: formData })
            .then(res => res.json())
            .then(data => {
                fileObj.status = 'success';
                fileObj.annotated = data.annotated;
                fileObj.resultId = data.id;
                doneCallback();
            })
            .catch(err => { console.error(err); alert("Upload failed"); });
    }

    updateProgress(progress) {
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        const circumference = 2*Math.PI*25;
        const offset = circumference - (progress/100)*circumference;
        if(progressBar) progressBar.style.strokeDashoffset = offset;
        if(progressText) progressText.textContent = Math.round(progress) + '%';
    }

    completeUpload() {
        setTimeout(() => {
            this.uploadBox.style.display = 'none';
            this.uploadComplete.style.display = 'block';
            const title = this.uploadComplete.querySelector('.complete-title');
            const subtitle = this.uploadComplete.querySelector('.complete-subtitle');
            title.textContent = "Upload Successful!";
            subtitle.textContent = `${this.files.length} file(s) processed`;
        }, 500);
    }

    viewDetectionResults() {
        if(this.files.length === 1 && this.files[0].resultId){
            window.location.href = `/result.html?id=${this.files[0].resultId}`;
        } else { this.viewUploadedFiles(); }
    }

    viewUploadedFiles() {
        this.filesList.innerHTML = "";
        this.files.forEach(fileObj => {
            if(fileObj.annotated){
                const img = document.createElement("img");
                img.src = fileObj.annotated;
                img.className = "file-preview";
                img.style.width = '120px';
                img.style.borderRadius = '12px';
                this.filesList.appendChild(img);
            }
        });
        this.uploadComplete.style.display = "none";
        this.filesPreview.classList.add("show");
    }

    startNewUpload() {
        this.files = [];
        this.filesList.innerHTML = '';
        this.uploadComplete.style.display = 'none';
        this.uploadBox.style.display = 'block';
        this.filesPreview.classList.remove('show');
        this.fileInput.value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => { window.fileUpload = new FileUploadComponent(); });
