// ===== Modal Component =====

function openModal(title, bodyHtml, footerHtml) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  
  content.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="btn-icon" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
  `;
  
  overlay.classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalOverlay')?.addEventListener('click', e => {
    if (e.target.id === 'modalOverlay') closeModal();
  });
});
