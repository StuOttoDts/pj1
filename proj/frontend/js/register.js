//const RegBtn = document.getElementById('RegBtn');
const btConfReg = document.getElementById('btConfReg');
const errorMsg = document.getElementById('errorReg'); // crie um span/div para mensagens de erro
const btcancReg = document.getElementById('btcancReg');


btConfReg.addEventListener('click', async () => {
    const nome = document.getElementById('name').value;
    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('password').value;
    alert('Criando registro...');
    const data = `nome=${encodeURIComponent(nome)}&cpf=${encodeURIComponent(cpf)}&senha=${encodeURIComponent(senha)}`;

    try {
        const res = await fetch('http://localhost:8080/register', {
            method: 'POST',
            headers: {'Content-Type':'application/x-www-form-urlencoded'},
            body: data
        });

        const text = await res.text();
        if(text === "OK"){
            alert('Registro criado com sucesso!');
            window.location.href = 'index.html';
        } else {
            errorMsg.style.display = 'block';
            errorMsg.innerText = 'Erro ao criar registro.';
        }
    } catch(e){
        console.error(e);
        alert('Erro de conexão com o servidor.');
    }
});
btcancReg.addEventListener('click', async () =>{
    alert('Registro Cancelado !!');
    window.location.href = 'index.html';
})