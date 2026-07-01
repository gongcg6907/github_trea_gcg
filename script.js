class ImageCompressor {
    constructor() {
        this.files = [];
        this.compressedFiles = [];
        this.quality = 80;
        this.outputFormat = 'original';
        this.maxSize = 0;
        this.darkMode = false;
        this.initElements();
        this.bindEvents();
        this.initDarkMode();
    }

    initElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.qualityRange = document.getElementById('qualityRange');
        this.qualityValue = document.getElementById('qualityValue');
        this.presetBtns = document.querySelectorAll('.preset-btn');
        this.formatBtns = document.querySelectorAll('.format-btn');
        this.sizeBtns = document.querySelectorAll('.size-btn');
        this.previewSection = document.getElementById('previewSection');
        this.previewGrid = document.getElementById('previewGrid');
        this.clearBtn = document.getElementById('clearBtn');
        this.compressBtn = document.getElementById('compressBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.originalSizeEl = document.getElementById('originalSize');
        this.compressedSizeEl = document.getElementById('compressedSize');
        this.savedSizeEl = document.getElementById('savedSize');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        this.darkModeToggle = document.getElementById('darkModeToggle');
    }

    bindEvents() {
        this.uploadBtn.addEventListener('click', function() {
            this.fileInput.click();
        }.bind(this));

        this.fileInput.addEventListener('change', function(e) {
            this.handleFiles(e.target.files);
        }.bind(this));

        this.uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        }.bind(this));

        this.uploadArea.addEventListener('dragleave', function() {
            this.uploadArea.classList.remove('dragover');
        }.bind(this));

        this.uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        }.bind(this));

        this.qualityRange.addEventListener('input', function(e) {
            this.quality = parseInt(e.target.value);
            this.qualityValue.textContent = this.quality + '%';
            this.updateActivePreset();
        }.bind(this));

        this.presetBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.quality = parseInt(btn.dataset.value);
                this.qualityRange.value = this.quality;
                this.qualityValue.textContent = this.quality + '%';
                this.updateActivePreset();
            }.bind(this));
        }.bind(this));

        this.formatBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.outputFormat = btn.dataset.format;
                this.updateActiveButton(this.formatBtns, btn);
            }.bind(this));
        }.bind(this));

        this.sizeBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.maxSize = parseInt(btn.dataset.size);
                this.updateActiveButton(this.sizeBtns, btn);
            }.bind(this));
        }.bind(this));

        this.clearBtn.addEventListener('click', function() {
            this.clearAll();
        }.bind(this));

        this.compressBtn.addEventListener('click', function() {
            this.compressAll();
        }.bind(this));

        this.downloadAllBtn.addEventListener('click', function() {
            this.downloadAll();
        }.bind(this));

        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('click', function() {
                this.toggleDarkMode();
            }.bind(this));
        }
    }

    initDarkMode() {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.toggleDarkMode(true);
        }
    }

    toggleDarkMode(forceDark) {
        this.darkMode = forceDark !== undefined ? forceDark : !this.darkMode;
        document.body.classList.toggle('dark', this.darkMode);
        if (this.darkModeToggle) {
            this.darkModeToggle.setAttribute('aria-label', this.darkMode ? '切换到浅色模式' : '切换到深色模式');
        }
    }

    updateActivePreset() {
        this.presetBtns.forEach(function(btn) {
            if (parseInt(btn.dataset.value) === this.quality) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }.bind(this));
    }

    updateActiveButton(buttons, activeBtn) {
        buttons.forEach(function(btn) {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    handleFiles(fileList) {
        var imageFiles = Array.from(fileList).filter(function(file) {
            return file.type.startsWith('image/');
        });

        if (imageFiles.length === 0) {
            this.showToast('请选择图片文件');
            return;
        }

        this.files = this.files.concat(imageFiles);
        this.compressAll();
    }

    compressAll() {
        var self = this;
        if (this.files.length === 0) return;

        this.showLoading();
        this.revokeAllUrls();
        this.compressedFiles = [];

        var count = 0;
        var total = this.files.length;

        function compressNext() {
            if (count >= total) {
                self.hideLoading();
                self.showPreview();
                self.showToast('成功压缩 ' + total + ' 张图片');
                return;
            }

            self.compressImage(self.files[count]).then(function(compressed) {
                self.compressedFiles.push(compressed);
                count++;
                compressNext();
            });
        }

        compressNext();
    }

    compressImage(file) {
        var self = this;
        return new Promise(function(resolve) {
            var reader = new FileReader();

            reader.onload = function(e) {
                var img = new Image();

                img.onload = function() {
                    var width = img.width;
                    var height = img.height;

                    if (self.maxSize > 0) {
                        var maxDim = Math.max(width, height);
                        if (maxDim > self.maxSize) {
                            var ratio = self.maxSize / maxDim;
                            width = Math.round(width * ratio);
                            height = Math.round(height * ratio);
                        }
                    }

                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');

                    canvas.width = width;
                    canvas.height = height;

                    ctx.drawImage(img, 0, 0, width, height);

                    var mimeType = file.type;
                    var ext = file.name.split('.').pop().toLowerCase();

                    if (self.outputFormat !== 'original') {
                        mimeType = 'image/' + self.outputFormat;
                        ext = self.outputFormat;
                    } else if (mimeType === 'image/png') {
                        mimeType = 'image/webp';
                        ext = 'webp';
                    }

                    canvas.toBlob(function(blob) {
                        resolve({
                            original: file,
                            compressed: blob,
                            width: width,
                            height: height,
                            url: URL.createObjectURL(blob),
                            ext: ext
                        });
                    }, mimeType, self.quality / 100);
                };

                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        });
    }

    revokeAllUrls() {
        this.compressedFiles.forEach(function(item) {
            if (item.url) {
                URL.revokeObjectURL(item.url);
            }
        });
    }

    showPreview() {
        this.previewSection.style.display = 'block';
        this.previewGrid.innerHTML = '';

        var originalTotal = 0;
        var compressedTotal = 0;
        var self = this;

        this.compressedFiles.forEach(function(item, index) {
            originalTotal += item.original.size;
            compressedTotal += item.compressed.size;

            var card = document.createElement('div');
            card.className = 'preview-card';

            var savePercent = Math.round((1 - item.compressed.size / item.original.size) * 100);

            card.innerHTML = '<div class="preview-image-container">' +
                '<img src="' + item.url + '" alt="Preview" class="compressed-img">' +
                '<img src="' + URL.createObjectURL(item.original) + '" alt="Original" class="original-img">' +
                '<div class="comparison-slider" data-index="' + index + '">' +
                '<div class="slider-handle"></div>' +
                '</div>' +
                '</div>' +
                '<button class="download-btn" data-index="' + index + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>' +
                '<polyline points="7 10 12 15 17 10"></polyline>' +
                '<line x1="12" y1="15" x2="12" y2="3"></line>' +
                '</svg>' +
                '</button>' +
                '<div class="card-info">' +
                '<div class="original-size">' + self.formatSize(item.original.size) + '</div>' +
                '<div class="compressed-size">' + self.formatSize(item.compressed.size) + ' <span class="save-percent">-' + savePercent + '%</span></div>' +
                '</div>';

            card.querySelector('.download-btn').addEventListener('click', function() {
                self.downloadFile(item, index);
            });

            self.setupComparisonSlider(card.querySelector('.comparison-slider'), card);

            self.previewGrid.appendChild(card);
        });

        this.originalSizeEl.textContent = this.formatSize(originalTotal);
        this.compressedSizeEl.textContent = this.formatSize(compressedTotal);

        var savedPercent = originalTotal > 0 ? Math.round((1 - compressedTotal / originalTotal) * 100) : 0;
        this.savedSizeEl.textContent = '-' + savedPercent + '%';
    }

    setupComparisonSlider(slider, card) {
        var container = card.querySelector('.preview-image-container');
        var compressedImg = card.querySelector('.compressed-img');
        var isDragging = false;

        var updateClip = function(e) {
            var rect = container.getBoundingClientRect();
            var clientX = e.touches ? e.touches[0].clientX : e.clientX;
            var x = clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            var percent = (x / rect.width) * 100;
            compressedImg.style.clipPath = 'inset(0 ' + (100 - percent) + '% 0 0)';
            slider.style.left = percent + '%';
        };

        slider.addEventListener('mousedown', function(e) {
            isDragging = true;
            updateClip(e);
        });

        slider.addEventListener('touchstart', function(e) {
            isDragging = true;
            updateClip(e);
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) updateClip(e);
        });

        document.addEventListener('touchmove', function(e) {
            if (isDragging) updateClip(e);
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
        });

        document.addEventListener('touchend', function() {
            isDragging = false;
        });
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';

        var k = 1024;
        var sizes = ['B', 'KB', 'MB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    downloadFile(item, index) {
        var url = URL.createObjectURL(item.compressed);
        var a = document.createElement('a');

        var name = item.original.name.replace(/\.[^/.]+$/, '') + '_compressed.' + item.ext;

        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('图片已下载');
    }

    downloadAll() {
        if (this.compressedFiles.length === 0) return;

        var count = 0;
        var total = this.compressedFiles.length;
        var self = this;

        this.compressedFiles.forEach(function(item, index) {
            setTimeout(function() {
                self.downloadFile(item, index);
                count++;
                if (count === total) {
                    self.showToast('已下载 ' + total + ' 张图片');
                }
            }, index * 200);
        });
    }

    clearAll() {
        this.revokeAllUrls();
        this.files = [];
        this.compressedFiles = [];
        this.fileInput.value = '';
        this.previewSection.style.display = 'none';
        this.previewGrid.innerHTML = '';
        this.showToast('已清空');
    }

    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');
        var self = this;
        setTimeout(function() {
            self.toast.classList.remove('show');
        }, 2500);
    }

    showLoading() {
        var overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(overlay);
        this.loadingOverlay = overlay;
    }

    hideLoading() {
        if (this.loadingOverlay) {
            document.body.removeChild(this.loadingOverlay);
            this.loadingOverlay = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new ImageCompressor();
});