// Elementos gráficos
const botaoAdicao = document.getElementById('butAdd'),
      lista = document.getElementById('listaInstrucoes'),
      addInstrucao = document.getElementById('opInstrucao'),
      addDest = document.getElementById('dest'),
      addSrc = document.getElementById('source'),
      addTempSpan = document.getElementById('tempSpan'),
      addTemp = document.getElementById('temp'),
      addImmediateSpan = document.getElementById('immSpan'),
      addImmediate = document.getElementById('imediato'),
      botRef = document.getElementById("pulaReferencias"),
      botVolta = document.getElementById("voltaReferencias"),
      referencias = document.getElementById("referencia");

// Implementação de delay assíncrono
async function delay(val) {
    return new Promise(res => {
        setTimeout(() => {
            res(2);
        }, val);
    });
}

// Processador com seus registradores
class Processador {
    constructor(
        numRegistros
    ) {
        // Confere número de registros
        if (this.numRegistros <= 0)
            return false;
        // Inicializa informações
        this.numRegistros = numRegistros;
        this.instrucoes = [];
        this.registradores = [];
        this.pc = 0;
        for (let i = 0; i < this.numRegistros; ++i)
            this.registradores.push(0);

        // Inicializa registradores de pipeline internos
        this.npc = null;
        this.ir = null;
        this.a = null;
        this.b = null;
        this.rt = null;
        this.rd = null;
        this.imm = null;
        this.rs = null;
        this.brTarget = null;
        this.zero = null;
        this.aluOut = null;
        this.rd2 = null;
        this.lmd = null;
    }

    // Cria e adiciona nova intrução
    adicionaInstrucao() {
        let i = new Instrucao();
        this.instrucoes.push(i);
        return i;
    }

    // Executa instruções salvas em sequência pelo número de etapas no pipeline
    async executar() {
        let pc = 0;
        for (let i = 0; i < this.instrucoes.length; ++i) {
            for (let j = i - 4; j <= i; ++j) {
                if (j < 0)
                    continue;
                this.instrucoes[j].step();
            }
            this.pc += 4;
            atualizaTabela();
            await delay(200);
        }
    }
}

// Cria novo processador
var processador = new Processador(32);

// Classe de instrução com suas funções
class Instrucao {
    constructor() {
        // Inicializa valores
        this.etapa = 0;
        this.instrucao = addInstrucao.options[addInstrucao.selectedIndex].value;
        this.rDest = parseInt(addDest.value);
        this.rSource1 = parseInt(addSrc.value);
        this.rSource2 = parseInt(addTemp.value);
        this.immediate = parseInt(addImmediate.value);
    }

    toString() {
        if (this.instrucao == "addi" || this.instrucao == "subi")
            return `${this.instrucao } \$r${this.rDest} \$r${this.rSource1} #${this.immediate}`;
        else if (this.instrucao == 'nop')
            return `nop`;
        else
            return `${this.instrucao } \$r${this.rDest} \$r${this.rSource1} \$r${this.rSource2}`;
    }

    // Executa atualização de informações por etapa
    step() {
        // Confere execução de instrução
        if (this.etapa > 5 || this.instrucao == 'nop')
            return;

        // Atualiza etapa
        this.etapa++;

        switch (this.etapa) {
            // Atualiza informações de processo
            case 1:
                processador.npc = processador.pc + 4;
                processador.ir = `(${this.instrucao})|${this.rSource1.toString(16)}|${this.rSource2.toString(16)}|${this.rDest.toString(16)}`;
                break;

            // Carrega informações de registro
            case 2:
                if (this.rSource1 != null)
                    processador.a = processador.registradores[this.rSource1];
                if (this.rSource2 != null &&
                    (this.instrucao != 'addi' && this.instrucao != 'subi'))
                    processador.b = processador.registradores[this.rSource2];
                processador.rd = this.rDest;
                processador.rs = this.rSource1;
                processador.rt = this.rSource2;
                if (this.instrucao == 'addi' || this.instrucao == 'subi')
                    processador.imm = this.immediate;
                break;

            // Realiza aritmética e cálculo de branching
            case 3:
                processador.brTarget = processador.npc + processador.imm;
                if (this.instrucao != 'nop') {
                    switch (this.instrucao) {
                        case 'add':
                            processador.aluOut = processador.a + processador.b;
                            break;
                        case 'addi':
                            processador.aluOut = processador.a + processador.imm;
                            break;
                        case 'sub':
                            processador.aluOut = processador.a - processador.b;
                            break;
                        case 'subi':
                            processador.aluOut = processador.a - processador.imm;
                            break;
                        case 'and':
                            processador.aluOut = processador.a && processador.b;
                            break;
                        case 'or':
                            processador.aluOut = processador.a || processador.b;
                            break;
                        case 'xor':
                            processador.aluOut = processador.a ^ processador.b;
                            break;
                        case 'xor':
                            processador.aluOut = !processador.a && !processador.b;
                            break;
                        case 'mult':
                            processador.aluOut = processador.a * processador.b;
                            break;
                        case 'div':
                            processador.aluOut = processador.a / processador.b;
                            break;
                    }
                }
                processador.rd2 = processador.rd; // ??????? MULT
                break;
            case 4:
                // Como não tem instrução de acesso à memória, ignora
                break;
            // Write-back
            case 5:
                if (this.instrucao == 'lw')
                    processador.registradores[processador.rd2] = processador.lmd;
                else
                    processador.registradores[processador.rd2] = processador.aluOut;
                break;
        }
    }
}

// Atualiza valores de registros na tabela
function atualizaTabela() {
    let cells = document.getElementsByTagName("td");
    for (let i = 2, j = 0; i < cells.length; i += 3, ++j)
        cells[i].innerText = processador.registradores[j].toString(16);
}

// Adiciona instrução escrita graficamente e internamente no processador
botaoAdicao.addEventListener("click", (e) => {
    let curDiv = document.createElement("span"),
        i = processador.adicionaInstrucao();
    curDiv.innerHTML = i.toString();
    lista.appendChild(curDiv);
    lista.appendChild(document.createElement("br"))
    lista.scrollTo({
        top: lista.scrollHeight,
        left: 0
    });
});

// Confere se necessário exibir campo de imediato
function exibeCampos() {
    if (addInstrucao.selectedIndex == 1 || addInstrucao.selectedIndex == 3) {
        document.getElementById('entradaTemp').setAttribute("style", "display: none");
        document.getElementById('entradaImediato').setAttribute("style", "");
    } else {
        document.getElementById('entradaTemp').setAttribute("style", "");
        document.getElementById('entradaImediato').setAttribute("style", "display: none");
    }
}

addInstrucao.addEventListener("change", exibeCampos);

// Pula para referências
botRef.addEventListener("click", (e) => {
    window.scrollTo({
        left: 0,
        top: referencias.offsetTop,
        behavior: "smooth"
    });
});

// Volta de referências
botVolta.addEventListener("click", (e) => {
    console.log("aaa");
    window.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth"
    });
});

// Atualiza tabela com valores zerados iniciais
atualizaTabela();
