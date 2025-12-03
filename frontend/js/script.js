document.addEventListener("DOMContentLoaded", () => {

    // =============================
    //   VARIÁVEIS INICIAIS
    // =============================
    const ls = localStorage;
    const cpfUsuario = ls.getItem("cpfUsuario");
    const nomeLogado = ls.getItem("nomeLogado");

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

    const modals = document.querySelectorAll("#modalcrud, #modalFiltro, #modalCategorias");
    const closeButtons = document.querySelectorAll(".close, .closeFiltro, .closeCategorias");

    const modalFiltro = document.getElementById("modalFiltro");
    const modalFiltrodtIni = document.getElementById("dtIni");
    const modalFiltrodtFim = document.getElementById("dtFim");
    const modalFiltroSave = document.getElementById("modalFiltroSave");

    const tabelaCategoriasBody = document.querySelector("#tabelaCategorias tbody");
    const modalCategorias = document.getElementById("modalCategorias");

    const btFiltro = document.getElementById("btFiltro");
    const btCategorias = document.getElementById("btCategorias");

    // elementos do gráfico/legenda
    const pie = document.getElementById("pie");
    // criamos/garantimos um container para legenda dentro de .graf-wrapper
    const grafWrapper = document.querySelector(".graf-wrapper");
    let legendContainer = document.getElementById("pieLegend");
    if (!legendContainer) {
        legendContainer = document.createElement("div");
        legendContainer.id = "pieLegend";
        legendContainer.style.margin = "18px";
        legendContainer.style.fontSize = "14px";
        legendContainer.style.maxHeight = "90px";;
        legendContainer.style.display = "flex";
        legendContainer.style.flexDirection = "column";
        legendContainer.style.gap = "6px";
        // se existir grafWrapper, insere a legenda à direita do pie
        if (grafWrapper) grafWrapper.appendChild(legendContainer);
    }

    let gastos = [];
    let currentAction = "";
    let currentIndex = null;
    let totaisPorTipo = {};

    if (nomeLogado) document.getElementById("nomeEncontrado").textContent = nomeLogado;

    const fetchJSON = async (url, options) =>
        (await fetch(url, options)).json();

    const openModal = modal => modal.style.display = "block";
    const closeModal = modal => modal.style.display = "none";

    const limparTabela = tbody => tbody.innerHTML = "";

    // =============================
    //   CARREGAR GASTOS
    // =============================
    async function carregarGastos() {
        gastos = await fetchJSON(
            `http://localhost:8080/BuscarGasto?cpf=${cpfUsuario}&dtIni=${ls.getItem("dtIni")}&dtFim=${ls.getItem("dtFim")}`
        );
        // garantir array válido
        if (!Array.isArray(gastos)) gastos = [];
    }

    // -----------------------------
    // Gera cor determinística a partir do nome (mantém cor estável)
    // -----------------------------
    function corFromString(str) {
        // simple hash -> hex color
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // keep 32-bit int
        }
        let color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        color = "00000".substring(0, 6 - color.length) + color;
        return `#${color}`;
    }

    // -----------------------------
    // formata porcentagem bonita
    // -----------------------------
    function fmtPct(val) {
        return Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`;
    }

    // =============================
    //   LISTAR TABELA + GRÁFICO
    // =============================
    async function atualizarTabela() {
        await carregarGastos();
        limparTabela(tabelaBody);

        totaisPorTipo = {};

        gastos.forEach((g, index) => {
            const tr = document.createElement("tr");

            if (!totaisPorTipo[g.tp]) {
                totaisPorTipo[g.tp] = 0;
            }
            totaisPorTipo[g.tp] += 1;

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

            tr.querySelector(".btupd").onclick = () =>
                abrirmodalcrud("edit", index);

            tr.querySelector(".btdel").onclick = async () => {
                if (!confirm("Deseja realmente remover este gasto?")) return;

                await fetch("http://localhost:8080/RemoverGasto", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: g.id, cpfUsuar: g.cpf })
                });

                atualizarTabela();
            };

            tabelaBody.appendChild(tr);
        });

        // ---- Porcentagens (contagem -> %) ----
        const totalGeral = gastos.length || 0;
        let porcentagens = {};
        if (totalGeral === 0) {
            // limpar gráfico e legenda
            pie.style.setProperty("--grafico", "none");
            pie.textContent = "0 itens";
            legendContainer.innerHTML = "<em style='color:#666'>Nenhum gasto no período</em>";
            return;
        }

        Object.entries(totaisPorTipo).forEach(([tipo, qtd]) => {
            porcentagens[tipo] = (qtd / totalGeral) * 100;
        });

        // ---- Cores (determinísticas por tipo) ----
        const coresPorTipo = {};
        for (const tipo of Object.keys(totaisPorTipo)) {
            coresPorTipo[tipo] = corFromString(tipo);
        }

        // ---- Montar conic-gradient ----
        // queremos segmentos do tipo: "#hex start% end%"
        let gradientParts = [];
        let acumulado = 0;

        // ordernar por maior para visual consistente (opcional)
        const sorted = Object.entries(porcentagens).sort((a,b) => b[1] - a[1]);

        sorted.forEach(([tipo, pct]) => {
            const start = acumulado;
            const end = acumulado + pct;
            const color = coresPorTipo[tipo];
            // garantir limites 0-100
            const s = Math.max(0, Math.min(100, start));
            const e = Math.max(0, Math.min(100, end));
            gradientParts.push(`${color} ${s}% ${e}%`);
            acumulado += pct;
        });

        const gradientStr = gradientParts.join(", ");

        // aplicamos na variável que o CSS (.pie::before) usa
        pie.style.setProperty("--grafico", `conic-gradient(${gradientStr})`);

        // conteudo central do pie
        pie.textContent = `${Object.keys(porcentagens).length} tipos`;

        // ---- Montar legenda ----
        // limpa e preenche com ordem igual ao gradient (sorted)
        legendContainer.innerHTML = ""; // limpa
        sorted.forEach(([tipo, pct]) => {
            const linha = document.createElement("div");
            linha.style.display = "flex";
            linha.style.alignItems = "center";
            linha.style.gap = "10px";

            const swatch = document.createElement("span");
            swatch.style.width = "16px";
            swatch.style.height = "16px";
            swatch.style.display = "inline-block";
            swatch.style.borderRadius = "3px";
            swatch.style.background = coresPorTipo[tipo];
            swatch.style.border = "1px solid rgba(0,0,0,0.1)";

            const label = document.createElement("span");
            label.textContent = `${tipo} — ${fmtPct(pct)}`;
            label.style.color = "#111";

            linha.appendChild(swatch);
            linha.appendChild(label);
            legendContainer.appendChild(linha);
        });
    }

    // =============================
    //   MODAL CRUD
    // =============================
    function abrirmodalcrud(action, index = null) {
        currentAction = action;
        currentIndex = index;

        modalcrudDesc.value = "";
        modalcrudAmount.value = "";
        modalcrudDtGast.value = "";
        modalcrudTpGast.value = "";

        if (action === "edit") {
            const g = gastos[index];
            modalcrudTitle.textContent = "Editar Gasto";

            modalcrudDesc.value = g.des;
            modalcrudAmount.value = g.vl;
            modalcrudDtGast.value = g.dt;
            modalcrudId.value = g.id;
            modalcrudTpGast.value = g.tp;
        } else {
            modalcrudTitle.textContent = "Adicionar Gasto";
        }

        openModal(modalcrud);
    }

    // =============================
    //   MODAL FILTRO
    // =============================
    function openmodalFiltro() {
        modalFiltrodtIni.value = ls.getItem("dtIni");
        modalFiltrodtFim.value = ls.getItem("dtFim");
        openModal(modalFiltro);
    }

    // =============================
    //   MODAL CATEGORIAS
    // =============================
    function openmodalCategorias() {
        openModal(modalCategorias);

        limparTabela(tabelaCategoriasBody);

        fetchJSON("http://localhost:8080/listarCategorias")
            .then(lista => {
                lista.forEach(c => {
                    tabelaCategoriasBody.innerHTML += `
                        <td>${c.tipo}</td>
                        <td>${c.descricaoCategoria}</td>
                        <td>
                            <button class="btupd"><i class="fa-solid fa-pen"></i></button>
                            <button class="btdel"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    `;
                });
            })
            .catch(() => {
                tabelaCategoriasBody.innerHTML =
                    "<tr><td colspan='3'>Erro ao carregar categorias</td></tr>";
            });
    }

    // =============================
    //   CARREGAR TIPOS NO COMBO
    // =============================
    function carregarTiposGasto() {
        fetchJSON("http://localhost:8080/listarCategorias")
            .then(lista => {
                modalcrudTpGast.innerHTML =
                    "<option value='0' selected>Selecione</option>";

                lista.forEach(c => {
                    modalcrudTpGast.innerHTML +=
                        `<option value="${c.tipo}">${c.descricaoCategoria}</option>`;
                });
            });
    }

    // =============================
    //   EVENTOS
    // =============================
    btAdd.onclick = () => abrirmodalcrud("add");
    btFiltro.onclick = openmodalFiltro;
    btCategorias.onclick = openmodalCategorias;

    modalcrudSave.onclick = async () => {
        if (!modalcrudDesc.value.trim() ||
            !modalcrudAmount.value.trim() ||
            !modalcrudDtGast.value.trim()) {
            alert("Preencha todos os campos.");
            return;
        }

        const gasto = {
            cpfUsuar: cpfUsuario,
            des: modalcrudDesc.value.trim(),
            vl: Number(modalcrudAmount.value),
            dt: modalcrudDtGast.value,
            id: modalcrudId.value || null,
            tp: modalcrudTpGast.value
        };

        const url = currentAction === "add"
            ? "http://localhost:8080/salvarGasto"
            : "http://localhost:8080/EditarGasto";

        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(gasto)
        });

        atualizarTabela();
        closeModal(modalcrud);
    };

    modalFiltroSave.onclick = () => {
        ls.setItem("dtIni", modalFiltrodtIni.value);
        ls.setItem("dtFim", modalFiltrodtFim.value);
        atualizarTabela();
        closeModal(modalFiltro);
    };

    window.onclick = e => {
        modals.forEach(modal => {
            if (e.target === modal) closeModal(modal);
        });
    };

    closeButtons.forEach(btn => {
        btn.onclick = () => {
            modals.forEach(closeModal);
        };
    });

    carregarTiposGasto();
    atualizarTabela();

});
