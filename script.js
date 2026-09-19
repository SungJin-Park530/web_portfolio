document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="#projects"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      document.querySelector('#projects').scrollIntoView({ behavior: 'smooth' });
    });
  });

  const modal = document.querySelector('#project-modal');
  const closeButton = modal.querySelector('.modal-close');

  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.project-card').forEach((card) => {
    const openCard = () => {
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    };

    card.addEventListener('click', (event) => {
      if (!event.target.closest('a')) openCard();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCard();
      }
    });
  });

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });
});