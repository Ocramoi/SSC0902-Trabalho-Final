// Elementos gráficos
const botaoAdicao = document.getElementById('butAdd'),
      botaoExec = document.getElementById("butExec"),
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
      referencias = document.getElementById("referencia"),
      regInt1 = document.getElementById('regs1'),
      regInt2 = document.getElementById('regs2'),
      regInt3 = document.getElementById('regs3'),
      regInt4 = document.getElementById('regs4'),

      instrs = document.querySelectorAll('span[instr="1"]'),
      // Set com todas instruções que operam rx + immediate
      instrucoesImediato = new Set(["addi","subi","multi","divi"]),
      instrucoesImediatoIndices = new Set([1,3,9,11]);;

let valsInstrs = ['...', '...', '...', '...', '...'];

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
        this.npc = 0;
        this.npc2 = 0;
        this.ir = 0;
        this.a = 0;
        this.b = 0;
        this.b2 = 0;
        this.rt = 0;
        this.rd = 0;
        this.rd2 = 0;
        this.rd3 = 0;
        this.imm = 0;
        this.rs = 0;
        this.brTarget = 0;
        this.zero = 0;
        this.aluOut = 0;
        this.aluOut2 = 0;
        this.lmd = 0;
    }
    // Cria e adiciona nova intrução
    adicionaInstrucao() {
        let instrucaoNome = addInstrucao.options[addInstrucao.selectedIndex].value;
        let instrucao = new Instrucao(instrucaoNome);
        this.instrucoes.push(instrucao);
        return instrucao;
    }

    _atualizaInternos() {
        regInt1.innerHTML = `<b>NPC:</b> ${this.npc.toString(2)}<br/>`;
        regInt1.innerHTML += `<b>IR:</b> ${this.ir.toString(2)}<br/>`;

        regInt2.innerHTML = `<b>NPC:</b> ${this.npc2.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>Val<sub>A</sub>:</b> ${this.a.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>Val<sub>B</sub>:</b> ${this.b.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>RT:</b> ${this.rt.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>RD:</b> ${this.rd.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>Imediato:</b> ${this.imm.toString(2)}<br/>`;
        regInt2.innerHTML += `<b>RS:</b> ${this.rs.toString(2)}<br/>`;

        regInt3.innerHTML = `<b>Branch Target:</b> ${this.brTarget.toString(2)}<br/>`;
        regInt3.innerHTML += `<b>Zero:</b> ${this.zero.toString(2)}<br/>`;
        regInt3.innerHTML += `<b>ALU Out:</b> ${this.aluOut.toString(2)}<br/>`;
        regInt3.innerHTML += `<b>B:</b> ${this.b2.toString(2)}<br/>`;
        regInt3.innerHTML += `<b>RD:</b> ${this.rd2.toString(2)}<br/>`;

        regInt4.innerHTML = `<b>LMD:</b> ${this.lmd.toString(2)}<br/>`;
        regInt4.innerHTML += `<b>ALU Out:</b> ${this.aluOut2.toString(2)}<br/>`;
        regInt4.innerHTML += `<b>RD:</b> ${this.rd3.toString(2)}<br/>`;
    }

    // Executa instruções salvas em sequência pelo número de etapas no pipeline
    async executar() {
        for (let i = 0; i < 6; i++) {
            let instrucaoNop = new Instrucao('nop');
            this.instrucoes.push(instrucaoNop);
        }

        this.pc = 0;
        for (let i = 0, k = 0;
             i < this.instrucoes.length;
             ++i, ++k) {
            for (let j = 0; j < 5; ++j) {
                let instrNum = i - 4 + j;
                if (instrNum < 0)
                    continue;
                this.instrucoes[instrNum].step();
            }
            
            valsInstrs.pop();
            console.log(this.instrucoes[i].instrucao)
            if (this.instrucoes[i].instrucao == 'nop') {
                valsInstrs.unshift('...');
            } else {
                valsInstrs.unshift(i);
            }

            atualizaInstrs();

            this.pc += 4;
            atualizaTabela();
            this._atualizaInternos();
            await delay(500);
        }
    }
}

// Cria novo processador
var processador = new Processador(32);

// Classe de instrução com suas funções
class Instrucao {
    constructor(instrucaoNome) {
        // Inicializa valores
        this.etapa = 0;
        this.instrucao = instrucaoNome;
        if (this.instrucao == 'nop') {
            this.rDest = 0;
            this.rSource1 = 0;
            this.rSource2 = 0;
            this.immediate = 0;
            return;
        }
        this.rDest = parseInt(addDest.value);
        this.rSource1 = parseInt(addSrc.value);
        this.rSource2 = parseInt(addTemp.value);
        this.immediate = parseInt(addImmediate.value);
    }

    toString() {
        // if (this.instrucao == "addi" || this.instrucao == "subi")
        if (instrucoesImediato.has(this.instrucao))
            return `${this.instrucao} \$r${this.rDest} \$r${this.rSource1} #${this.immediate}`;
        else if (this.instrucao == 'nop')
            return `nop`;
        else
            return `${this.instrucao} \$r${this.rDest} \$r${this.rSource1} \$r${this.rSource2}`;
    }

    // Executa atualização de informações por etapa
    step() {
        // Confere execução de instrução
        if (this.etapa > 5)
            return;

        // Atualiza etapa
        this.etapa++;

        switch (this.etapa) {
            // Atualiza informações de processo
            case 1:
                processador.npc = processador.pc + 4;
                if (this.instrucao == 'nop')
                    processador.ir = `(nop)`;
                else
                    processador.ir = `(${this.instrucao})|${this.rSource1.toString(2)}|${this.rSource2.toString(2)}|${this.rDest.toString(2)}`;
                break;

            // Carrega informações de registro
            case 2:
                // if (this.rSource1 != 0)
                processador.a = processador.registradores[this.rSource1];
                // if (this.rSource2 != 0 && !instrucoesImediato.has(this.instrucao))
                processador.b = processador.registradores[this.rSource2];
                processador.rd = this.rDest;
                processador.rs = this.rSource1;
                processador.rt = this.rSource2;
                processador.npc2 = processador.npc;
                if (instrucoesImediato.has(this.instrucao))
                    processador.imm = this.immediate;
                break;

            // Realiza aritmética e cálculo de branching
            case 3:
                processador.brTarget = processador.npc + processador.imm;
                processador.zero = 0;
                if (this.instrucao == 'nop') {
                    processador.aluOut = 0
                } else  {
                    // Adiantamento (forwarding) no resultado da operação anterior (rd = registrador destino da EX/MEM)
                    if (processador.rd2 == processador.rs) { // rd da EX/MEM é o ra
                        processador.a = processador.aluOut;
                    } else if (processador.rd2 == processador.rt) { // rd da EX/MEM é o rb
                        processador.b = processador.aluOut;
                    }

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
                        case 'multi':
                            processador.aluOut = processador.a * processador.imm;
                            break;
                        case 'div':
                            processador.aluOut = processador.a / processador.b;
                            break;
                        case 'divi':
                            processador.aluOut = processador.a / processador.imm;
                            break;
                    }
                }
                processador.aluOut = parseInt(processador.aluOut);
                processador.rd2 = processador.rd; // ??????? MULT
                processador.b2 = processador.b;
                break;
            case 4:
                processador.rd3 = processador.rd2;
                processador.aluOut2 = processador.aluOut;
                // Como não tem instrução de acesso à memória, ignora
                this.lmd = 0;
                break;
            // Write-back
            case 5:
                if (this.instrucao == 'lw')
                    processador.registradores[processador.rd3] = processador.lmd;
                else if (this.instrucao != 'nop')
                    processador.registradores[processador.rd3] = processador.aluOut2;
                break;
        }
    }
}

// Atualiza valores de registros na tabela
function atualizaTabela() {
    let cells = document.getElementsByTagName("td");
    for (let i = 2, j = 0; i < cells.length; i += 3, ++j)
        cells[i].innerText = processador.registradores[j].toString(2);
}

// Adiciona instrução escrita graficamente e internamente no processador
botaoAdicao.addEventListener("click", (e) => {
    let curDiv = document.createElement("span"),
        i = processador.adicionaInstrucao(),
        num = lista.children.length;
    curDiv.innerHTML = `i${num}: ${i.toString()}`;
    lista.appendChild(curDiv);
    lista.scrollTo({
        top: lista.scrollHeight,
        left: 0
    });
});

// Confere se necessário exibir campo de imediato
function exibeCampos() {
    if (instrucoesImediatoIndices.has(addInstrucao.selectedIndex)) {
        document.getElementById('entradaTemp').setAttribute("style", "display: none");
        document.getElementById('entradaImediato').setAttribute("style", "");
    } else {
        document.getElementById('entradaTemp').setAttribute("style", "");
        document.getElementById('entradaImediato').setAttribute("style", "display: none");
    }
}

function atualizaInstrs() {
    for (let i = 0; i < 5; ++i) {
        if (valsInstrs[i] != '...')
            instrs[i].innerText = `i${valsInstrs[i]}`;
        else
            instrs[i].innerText = `...`;
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
    window.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth"
    });
});

botaoExec.addEventListener('click', (e) => {
    processador.executar();
});

// Atualiza tabela com valores zerados iniciais
atualizaTabela();
