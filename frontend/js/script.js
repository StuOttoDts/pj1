document.addEventListener("DOMContentLoaded", () => {

    const cpfUsuario = localStorage.getItem("cpfUsuario") || null;
    const dtIni = localStorage.getItem("dtIni") || null;
    const dtFim = localStorage.getItem("dtFim") || null;
    const nomeLogado = localStorage.getItem("nomeLogado");

    const btAdd = document.querySelector(".btadd");
    const tabelaBody = document.querySelector("#tabelaGastos tbody");

    const modalcrud = document.getElementById("modalcrud");
    const modalcrudTitle = document.getElementById("modalcrudTitle");
    const modalcrudDesc = document.getElementById("Desc");
    const modalcrudAmount = document.getElementById("Amount");
    const modalcrudDtGast = document.getElementById("dtGasto");
    const modalcrudId = document.getElementById("ID");
    const modalcrudTpGast = document.getElementById("comboTipoGasto");
    const modalcrudSave = document.getElementById("modalcrudSave");
    const spanClose = document.querySelector(".close");
    const btLogoff = document.getElementById("btLogoff");
    const btFiltro = document.getElementById("btFiltro");
    const modalFiltro = document.getElementById("modalFiltro");
    const modalFiltroTitle = document.getElementById("modalFiltroTitle");
    const modalFiltrodtIni = document.getElementById("dtIni");
    const modalFiltrodtFim = document.getElementById("dtFim");
    const modalFiltroSave  = document.getElementById("modalFiltroSave");
    const closeFiltro = document.querySelector(".closeFiltro");
    const pie = document.querySelector("#pie");
    const btCategorias = document.getElementById("btCategorias");
    //const p = document.getElementById("percent").value;

    if (nomeLogado) {
        document.getElementById("nomeEncontrado").textContent = nomeLogado;
    }

    let gastos = [];
    let currentAction = "";
    let currentIndex = null;

    // =============================
    //   LISTAR NA TABELA
    // =============================
    async function atualizarTabela() {
    // 1. Buscar gastos antes de mexer na tabela
    await carregarGastos();

    // 2. Limpar tabela antes de renderizar
    tabelaBody.innerHTML = "";

    // 3. Preencher tabela
    gastos.forEach((g, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${g.id}</td>
            <td>${g.dt}</td>
            <td>${g.cpf}</td>
            <td>${g.des}</td>
            <td>R$ ${parseFloat(g.vl).toFixed(2)}</td>
            <td>${g.tp}</td>
            <td>
                <button class="btupd"><i class="fa-solid fa-pen"></i></button>
                <button class="btdel"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;

        // Botão editar
        tr.querySelector(".btupd").addEventListener("click", () => {
            abrirmodalcrud("edit", index);
        });

        // Botão deletar
        tr.querySelector(".btdel").addEventListener("click", async () => {
            if (confirm("Deseja realmente remover este gasto?")) {
                await fetch("http://localhost:8080/RemoverGasto", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: g.id, cpfUsuar: g.cpf })
                });
                atualizarTabela(); // Atualiza após remover
            }
        });

        tabelaBody.appendChild(tr);
    });
}
    atualizarTabela();

    // =============================
    // ADD / EDIT modalcrud
    // =============================
    btLogoff.addEventListener("click", () => {
        alert('Deslogando...');
        window.location.href = 'index.html';
    });
    carregarTiposGasto();
    
    btFiltro.addEventListener("click", () => {
        //alert("Filtro");
        openmodalFiltro();
    });
    
    function openmodalFiltro(){
        modalFiltrodtFim.value = localStorage.getItem("dtFim");
        modalFiltrodtIni.value = localStorage.getItem("dtIni");
        modalFiltroTitle.textContent = "Filtros";

        modalFiltro.style.display = "block";
    };
    function abrirmodalcrud(action, index = null) {
        currentAction = action;
        currentIndex = index;
        modalcrudDesc.value = "";
        modalcrudAmount.value = "";
        modalcrudDtGast.value = "";
        modalcrudTpGast.value = "";

        if (action === "add") {
            modalcrudTitle.textContent = "Adicionar Gasto";
        } else if (action === "edit") {
            const g                 = gastos[currentIndex];
            modalcrudTitle.textContent  = "Editar Gasto";
            modalcrudDesc.value         = g.des;
            modalcrudAmount.value       = g.vl;
            modalcrudDtGast.value       = g.dt;
            modalcrudId.value           = g.id;
            modalcrudTpGast.value       = g.tp;
        }

        modalcrud.style.display = "block";
    }

    btAdd.addEventListener("click", () => abrirmodalcrud("add"));
    spanClose.addEventListener("click", () => modalcrud.style.display = "none");
    window.addEventListener("click", e => { if (e.target === modalcrud) modalcrud.style.display = "none"; });
    window.addEventListener("click", e => { if (e.target === modalFiltro) modalFiltro.style.display = "none"; });
    closeFiltro.addEventListener("click", () => modalFiltro.style.display = "none");
    // =============================
    // SALVAR GASTO (JSON)
    // =============================
    modalcrudSave.addEventListener("click", async () => {
        if (!modalcrudDesc.value.trim() || !modalcrudAmount.value.trim() || !modalcrudDtGast.value.trim()) {
            alert("Preencha todos os campos.");
            return;
        }

        const gasto = {
            cpfUsuar: cpfUsuario,
            des: modalcrudDesc.value.trim(),
            vl: Number(modalcrudAmount.value),
            dt: modalcrudDtGast.value,
            id: modalcrudId.value || null,
            tp: modalcrudTpGast.value,
        };

        if (currentAction === "add") {
            await fetch("http://localhost:8080/salvarGasto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(gasto)
            });
        } else if (currentAction === "edit") {
            //alert('Edit');
            await fetch("http://localhost:8080/EditarGasto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(gasto)
            });
        }

        atualizarTabela();
        modalcrud.style.display = "none";
    });
    modalFiltroSave.addEventListener("click", async () =>{
        localStorage.setItem("dtIni", modalFiltrodtIni.value);
        localStorage.setItem("dtFim", modalFiltrodtFim.value);
        //alert("DtIni: " + modalFiltrodtIni.value + " dtFim: " + modalFiltrodtFim.value);
        atualizarTabela();  
        modalFiltro.style.display = "none";
    });
    async function carregarGastos() {
    const cpfUsuario = localStorage.getItem("cpfUsuario");
    const dtIni = localStorage.getItem("dtIni");
    const dtFim = localStorage.getItem("dtFim");

    console.log("Buscando com:", dtIni, dtFim);

    const res = await fetch(
        `http://localhost:8080/BuscarGasto?cpf=${cpfUsuario}&dtIni=${dtIni}&dtFim=${dtFim}`
    );

    gastos = await res.json();
}
    // =============================
    // LISTAR CATEGORIAS (JSON)
    // =============================
    function carregarTiposGasto() {
        fetch("http://localhost:8080/listarCategorias")
            .then(r => r.json())
            .then(lista => {
                const combo = modalcrudTpGast;
                combo.innerHTML = "";

                const optPadrao = document.createElement("option");
                optPadrao.value = "0";
                optPadrao.textContent = "Selecione";
                optPadrao.disabled = false;
                optPadrao.selected = true;
                combo.appendChild(optPadrao);

                lista.forEach(item => {
                    const opt = document.createElement("option");
                    opt.value = item.tipo;
                    opt.textContent = item.descricaoCategoria;
                    combo.appendChild(opt);
                });
            });
    }
    function updatePie() {
        
  
        if (p >= 0 && p <= 100) {
            pie.style.setProperty("--p", p);
            pie.textContent = p + "%";
        }
    }
});
