const btAdd = document.querySelector('.btadd');
const btDel = document.querySelector('.btdel');
const btUpd = document.querySelector('.btupd');
const listaGastos = document.getElementById('listaGastos');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalSave = document.getElementById('modalSave');
const spanClose = document.querySelector('.close');

let gastos = [];
let currentAction = '';
let currentIndex = -1;

function atualizarLista() {
    listaGastos.innerHTML = '';
    gastos.forEach(gasto => {
        const li = document.createElement('li');
        li.textContent = gasto;
        listaGastos.appendChild(li);
    });
}

function abrirModal(action) {
    currentAction = action;
    modalInput.value = '';
    modalInput.style.display = 'block';

    if(action === 'add'){
        modalTitle.textContent = 'Adicionar Gasto';
    } else if(action === 'edit'){
        if(gastos.length === 0){
            alert('Não há gastos para editar.');
            return;
        }
        currentIndex = gastos.length - 1;
        modalInput.value = gastos[currentIndex];
        modalTitle.textContent = 'Editar Último Gasto';
    } else if(action === 'del'){
        if(gastos.length === 0){
            alert('Não há gastos para remover.');
            return;
        }
        currentIndex = gastos.length - 1;
        modalTitle.textContent = 'Remover Último Gasto?';
        modalInput.style.display = 'none';
    }
    modal.style.display = 'block';
}

btAdd.addEventListener('click', () => abrirModal('add'));
btUpd.addEventListener('click', () => abrirModal('edit'));
btDel.addEventListener('click', () => abrirModal('del'));

modalSave.addEventListener('click', () => {
    if(currentAction === 'add' && modalInput.value.trim() !== ''){
        gastos.push(modalInput.value.trim());
    } else if(currentAction === 'edit' && modalInput.value.trim() !== ''){
        gastos[currentIndex] = modalInput.value.trim();
    } else if(currentAction === 'del'){
        gastos.pop();
    }
    modal.style.display = 'none';
    atualizarLista();
});

spanClose.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => { if(e.target === modal) modal.style.display = 'none'; });
