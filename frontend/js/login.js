const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('error');
const RegBtn = document.getElementById('RegBtn');

let dtIni = new Date();
let dtFim = new Date();

loginBtn.addEventListener('click', async () => {
    const cpf = document.getElementById('cpf').value.trim();
    const senha = document.getElementById('password').value.trim();

    if (!cpf || !senha) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = 'Preencha CPF e senha.';
        return;
    }

    const bodyJson = { cpf, senha };

    try {
        const res = await fetch('http://localhost:8080/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyJson)
        });

        const dataJson = await res.json();

        if (dataJson.status === "OK") {

            dtIni.setDate(dtIni.getDate() - 30);

            localStorage.setItem("nomeLogado", dataJson.nomeUsuar);
            localStorage.setItem("cpfUsuario", dataJson.cpfUsuar);
            localStorage.setItem("dtIni", dtIni.toISOString().split("T")[0]);
            localStorage.setItem("dtFim", dtFim.toISOString().split("T")[0]);

            alert(localStorage.getItem("dtIni") + " - " + localStorage.getItem("dtFim"));

            window.location.href = 'dashboard.html';

        } else {
            errorMsg.style.display = 'block';
            errorMsg.innerText = 'CPF ou senha incorretos.';
        }
    } 
    catch (e) {
        console.error(e);
        alert('Erro ao conectar com o servidor.');
    }
});

RegBtn.addEventListener("click", () => {
    window.location.href = 'register.html';
});
