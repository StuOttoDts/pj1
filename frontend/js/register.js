const btConfReg = document.getElementById('btConfReg');
const errorMsg = document.getElementById('errorReg');
const btcancReg = document.getElementById('btcancReg');

btConfReg.addEventListener('click', async () => {
    const nome = document.getElementById('name').value;
    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('password').value;

    if (!cpf || !senha || !nome) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = 'Preencha Nome, CPF e senha.';
        return;
    }

    const bodyJson = {
        nome: nome,
        cpf: cpf,
        senha: senha
    };

    try {
        const res = await fetch('http://localhost:8080/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyJson)
        });

        const dataJson = await res.json();

        if (dataJson.status === "OK") {
            window.location.href = 'index.html';
        } else {
            errorMsg.style.display = 'block';
            errorMsg.innerText = 'Erro ao criar registro.';
        }
    } catch (e) {
        console.error(e);
        alert('Erro de conexão com o servidor.');
    }
});

btcancReg.addEventListener('click', async () => {
    window.location.href = 'index.html';
});
