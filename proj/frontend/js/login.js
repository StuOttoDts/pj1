const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('error');
const RegBtn = document.getElementById('RegBtn'); // ADICIONE ESTA LINHA

loginBtn.addEventListener('click', async () => {
    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('password').value;

    const data = `cpf=${encodeURIComponent(cpf)}&senha=${encodeURIComponent(senha)}`;

    try {
        const res = await fetch('http://localhost:8080/login', {
            method: 'POST',
            headers: {'Content-Type':'application/x-www-form-urlencoded'},
            body: data
        });

        const text = await res.text();
        if(text === "OK"){
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.style.display = 'block';
            errorMsg.innerText = 'CPF ou senha incorretos.';
        }
    } catch(e){
        console.error(e);
        alert(e);
    }
});
RegBtn.addEventListener("click", async() =>{
    window.location.href = 'register.html';
})
