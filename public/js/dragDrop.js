document.addEventListener('DOMContentLoaded', function () {
    const draggableOptionsContainer = document.querySelector('.draggable-options');
    const dropTargets = document.querySelectorAll('.drop-target');
    const resetButton = document.getElementById('reset-button');
    const submitButton = document.getElementById('submit-answer-button');

    const originalDraggableOptionsHTML = draggableOptionsContainer.innerHTML;

    // Fungsi untuk membersihkan drop-target
    function clearDropTarget(target) {
        // Hapus semua child nodes
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }
        
        // Hapus data dan kelas
        delete target.dataset.droppedValue;
        target.classList.remove('has-content', 'correct', 'incorrect');
    }

    // Inisialisasi untuk pilihan jawaban
    let draggableSortableInstance = new Sortable(draggableOptionsContainer, {
        group: {
            name: 'shared',
            pull: 'clone',
            put: true
        },
        animation: 150,
        sort: true,
        onAdd: function (evt) {
            const returnedItem = evt.item;
            const returnedValue = returnedItem.dataset.value;

            // Buat clone untuk tetap di options
            const clone = returnedItem.cloneNode(true);
            draggableOptionsContainer.appendChild(clone);
            
            // Hapus item yang dikembalikan
            returnedItem.remove();

            // Bersihkan drop-target yang memiliki nilai ini
            dropTargets.forEach(target => {
                if (target.dataset.droppedValue === returnedValue) {
                    clearDropTarget(target);
                }
            });
        },
        onEnd: function (evt) {
            if (evt.to === draggableOptionsContainer && evt.pullMode === 'clone') {
                evt.item.remove();
            }
        }
    });

    // Inisialisasi drop-target
    dropTargets.forEach(function (target) {
        new Sortable(target, {
            group: 'shared',
            animation: 150,
            onAdd: function (evt) {
                const droppedItem = evt.item;
                const targetElement = evt.to;
                const droppedValue = droppedItem.dataset.value;

                // Jika sudah ada item di target, kembalikan ke options
                const existingItems = targetElement.querySelectorAll('.draggable-item');
                existingItems.forEach(item => {
                    if (item !== droppedItem) {
                        const existingValue = item.dataset.value;
                        
                        // Buat clone untuk options
                        const cloneForOptions = item.cloneNode(true);
                        draggableOptionsContainer.appendChild(cloneForOptions);
                        
                        // Tampilkan item yang tersembunyi di options
                        const hiddenItems = draggableOptionsContainer.querySelectorAll(`[data-value="${existingValue}"]`);
                        hiddenItems.forEach(hiddenItem => {
                            if (hiddenItem.style.display === 'none') {
                                hiddenItem.style.display = '';
                            }
                        });
                        
                        // Hapus item dari target
                        item.remove();
                    }
                });

                // Set data untuk target
                targetElement.dataset.droppedValue = droppedValue;
                targetElement.classList.add('has-content');

                // Sembunyikan item asli di options
                const originalItems = draggableOptionsContainer.querySelectorAll(`[data-value="${droppedValue}"]`);
                originalItems.forEach(item => {
                    if (item !== droppedItem && item.style.display !== 'none') {
                        item.style.display = 'none';
                    }
                });
            },
            onRemove: function (evt) {
                const fromTarget = evt.from;
                clearDropTarget(fromTarget);
            }
        });
    });

    function resetAllSelections() {
        // Bersihkan semua drop targets
        dropTargets.forEach(target => {
            clearDropTarget(target);
        });

        // Kembalikan pilihan jawaban ke kondisi awal
        draggableOptionsContainer.innerHTML = originalDraggableOptionsHTML;

        // Pastikan semua item terlihat
        [...draggableOptionsContainer.children].forEach(child => {
            if (child.style) {
                child.style.display = '';
            }
        });

        // Reinisialisasi sortable untuk options
        if (draggableSortableInstance) {
            draggableSortableInstance.destroy();
        }
        
        draggableSortableInstance = new Sortable(draggableOptionsContainer, {
            group: {
                name: 'shared',
                pull: 'clone',
                put: true
            },
            animation: 150,
            sort: true,
            onAdd: function (evt) {
                const returnedItem = evt.item;
                const returnedValue = returnedItem.dataset.value;

                const clone = returnedItem.cloneNode(true);
                draggableOptionsContainer.appendChild(clone);
                returnedItem.remove();

                dropTargets.forEach(target => {
                    if (target.dataset.droppedValue === returnedValue) {
                        clearDropTarget(target);
                    }
                });
            },
            onEnd: function (evt) {
                if (evt.to === draggableOptionsContainer && evt.pullMode === 'clone') {
                    evt.item.remove();
                }
            }
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', resetAllSelections);
    }

    if (submitButton) {
        submitButton.addEventListener('click', function () {
            const answers = {};
            let allFilled = true;

            dropTargets.forEach(function (target, index) {
                const droppedValue = target.dataset.droppedValue;
                if (droppedValue) {
                    answers['gap_' + index] = droppedValue;
                } else {
                    answers['gap_' + index] = '';
                    allFilled = false;
                }
            });

            if (!allFilled) {
                alert('Harap isi semua bagian rumpang sebelum mengirim!');
                return;
            }

            fetch('/submit-question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(answers)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                    alert('Skor Anda: ' + data.score + ' dari ' + data.total_questions);
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Terjadi kesalahan saat mengirim jawaban.');
                });
        });
    }
});