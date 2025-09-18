const menuBtn = document.querySelector('.menu-btn');
const menuItems = document.querySelector('.menu-items');

menuBtn.addEventListener('click', () => {
  menuItems.style.display =
    menuItems.style.display === 'block' ? 'none' : 'block';
});
