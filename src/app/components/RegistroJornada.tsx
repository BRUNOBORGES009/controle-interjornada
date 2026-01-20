"use client"

import { useState, useEffect } from "react"
import { Clock, Truck, User, Calendar, AlertCircle, Key, Edit2, Trash2, Search, PlayCircle, StopCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Motorista {
  id: string
  nomeCompleto: string
  frota: string
}

interface Jornada {
  id: string
  motoristaId: string
  motoristaNome: string
  caminhao: string
  inicioJornada: string
  fimJornada: string | null
  inicioDescanso: string | null
  fimDescansoObrigatorio: string | null
  senha: string | null
  status: "em_jornada" | "descansando" | "liberado"
}

export default function RegistroJornada() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [motoristaSelecionado, setMotoristaSelecionado] = useState("")
  const [caminhao, setCaminhao] = useState("")
  const [inicioJornada, setInicioJornada] = useState("")
  const [senhaGerada, setSenhaGerada] = useState("")
  const [dialogSenhaAberto, setDialogSenhaAberto] = useState(false)
  const [dialogTempoAberto, setDialogTempoAberto] = useState(false)
  const [filtroNome, setFiltroNome] = useState("")
  const [jornadaEditando, setJornadaEditando] = useState<Jornada | null>(null)
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false)
  const [dialogMotoristaEmJornadaAberto, setDialogMotoristaEmJornadaAberto] = useState(false)
  const [motoristaBloqueado, setMotoristaBloqueado] = useState("")
  const [dialogFinalizarAberto, setDialogFinalizarAberto] = useState(false)
  const [jornadaParaFinalizar, setJornadaParaFinalizar] = useState<string | null>(null)
  const [fimJornadaInput, setFimJornadaInput] = useState("")

  // Carregar motoristas e jornadas do localStorage
  useEffect(() => {
    const motoristasSalvos = localStorage.getItem("motoristas")
    if (motoristasSalvos) {
      setMotoristas(JSON.parse(motoristasSalvos))
    }

    const jornadasSalvas = localStorage.getItem("jornadas")
    if (jornadasSalvas) {
      setJornadas(JSON.parse(jornadasSalvas))
    }
  }, [])

  // Salvar jornadas no localStorage
  useEffect(() => {
    if (jornadas.length > 0) {
      localStorage.setItem("jornadas", JSON.stringify(jornadas))
    }
  }, [jornadas])

  // Função para gerar senha de 4 dígitos (não inicia com zero)
  const gerarSenha = () => {
    const primeiroDigito = Math.floor(Math.random() * 9) + 1 // 1-9
    const segundoDigito = Math.floor(Math.random() * 10) // 0-9
    const terceiroDigito = Math.floor(Math.random() * 10) // 0-9
    const quartoDigito = Math.floor(Math.random() * 10) // 0-9
    
    return `${primeiroDigito}${segundoDigito}${terceiroDigito}${quartoDigito}`
  }

  // Função para calcular duração da jornada em minutos
  const calcularDuracaoJornada = (inicio: string, fim: string) => {
    const inicioDate = new Date(inicio)
    const fimDate = new Date(fim)
    const diffMs = fimDate.getTime() - inicioDate.getTime()
    return Math.floor(diffMs / (1000 * 60)) // Retorna em minutos
  }

  // Iniciar nova jornada
  const iniciarJornada = () => {
    if (!motoristaSelecionado || !caminhao || !inicioJornada) {
      alert("Preencha todos os campos!")
      return
    }

    const motorista = motoristas.find(m => m.id === motoristaSelecionado)
    if (!motorista) return

    // Verificar se o motorista já tem uma jornada em andamento
    const jornadaEmAndamento = jornadas.find(
      j => j.motoristaId === motorista.id && j.status === "em_jornada"
    )

    if (jornadaEmAndamento) {
      setMotoristaBloqueado(motorista.nomeCompleto)
      setDialogMotoristaEmJornadaAberto(true)
      return
    }

    const novaJornada: Jornada = {
      id: Date.now().toString(),
      motoristaId: motorista.id,
      motoristaNome: motorista.nomeCompleto,
      caminhao,
      inicioJornada,
      fimJornada: null,
      inicioDescanso: null,
      fimDescansoObrigatorio: null,
      senha: null,
      status: "em_jornada"
    }

    setJornadas([...jornadas, novaJornada])
    
    // Limpar formulário
    setMotoristaSelecionado("")
    setCaminhao("")
    setInicioJornada("")
  }

  // Abrir dialog para finalizar jornada
  const abrirDialogFinalizar = (jornadaId: string) => {
    setJornadaParaFinalizar(jornadaId)
    setFimJornadaInput("")
    setDialogFinalizarAberto(true)
  }

  // Finalizar jornada existente
  const finalizarJornada = () => {
    if (!jornadaParaFinalizar || !fimJornadaInput) {
      alert("Preencha a data e hora de término!")
      return
    }

    const jornada = jornadas.find(j => j.id === jornadaParaFinalizar)
    if (!jornada) return

    const inicio = new Date(jornada.inicioJornada)
    const fim = new Date(fimJornadaInput)

    // Validar se o fim é depois do início
    if (fim <= inicio) {
      alert("A data de fim deve ser posterior à data de início!")
      return
    }

    const fimDescanso = new Date(fim.getTime() + (11 * 60 * 60 * 1000) + (2 * 60 * 1000)) // 11h e 2min

    // Verificar se a jornada é menor que 08:48 (528 minutos)
    const duracaoMinutos = calcularDuracaoJornada(jornada.inicioJornada, fimJornadaInput)
    if (duracaoMinutos < 528) {
      setDialogTempoAberto(true)
    }

    // Gerar senha de 4 dígitos
    const senha = gerarSenha()

    const jornadaAtualizada = {
      ...jornada,
      fimJornada: fimJornadaInput,
      inicioDescanso: fimJornadaInput,
      fimDescansoObrigatorio: fimDescanso.toISOString(),
      senha,
      status: "descansando" as const
    }

    setJornadas(prev => prev.map(j => 
      j.id === jornadaParaFinalizar ? jornadaAtualizada : j
    ))

    setSenhaGerada(senha)
    setDialogFinalizarAberto(false)
    setDialogSenhaAberto(true)
    setJornadaParaFinalizar(null)
    setFimJornadaInput("")
  }

  const abrirEdicao = (jornada: Jornada) => {
    setJornadaEditando(jornada)
    setDialogEditarAberto(true)
  }

  const salvarEdicao = () => {
    if (!jornadaEditando) return

    // Recalcular fim de descanso se as datas mudaram e a jornada foi finalizada
    if (jornadaEditando.fimJornada) {
      const fim = new Date(jornadaEditando.fimJornada)
      const fimDescanso = new Date(fim.getTime() + (11 * 60 * 60 * 1000) + (2 * 60 * 1000))

      const jornadaAtualizada = {
        ...jornadaEditando,
        fimDescansoObrigatorio: fimDescanso.toISOString()
      }

      setJornadas(prev => prev.map(j => 
        j.id === jornadaEditando.id ? jornadaAtualizada : j
      ))
    } else {
      setJornadas(prev => prev.map(j => 
        j.id === jornadaEditando.id ? jornadaEditando : j
      ))
    }

    setDialogEditarAberto(false)
    setJornadaEditando(null)
  }

  const removerJornada = (id: string) => {
    if (confirm("Tem certeza que deseja remover este registro de jornada?")) {
      const novasJornadas = jornadas.filter(j => j.id !== id)
      setJornadas(novasJornadas)
      localStorage.setItem("jornadas", JSON.stringify(novasJornadas))
    }
  }

  const calcularTempoJornada = (inicio: string, fim: string | null) => {
    if (!fim) {
      const agora = new Date()
      const inicioDate = new Date(inicio)
      const diff = agora.getTime() - inicioDate.getTime()
      const horas = Math.floor(diff / (1000 * 60 * 60))
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${horas}h ${minutos}min (em andamento)`
    }
    
    const inicioDate = new Date(inicio)
    const fimDate = new Date(fim)
    const diff = fimDate.getTime() - inicioDate.getTime()
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${horas}h ${minutos}min`
  }

  const formatarData = (data: string | null) => {
    if (!data) return "N/A"
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Filtrar apenas jornadas em andamento (status "em_jornada")
  const jornadasEmAndamento = jornadas.filter(jornada => jornada.status === "em_jornada")

  // Filtrar jornadas por nome do motorista
  const jornadasFiltradas = jornadasEmAndamento.filter(jornada =>
    jornada.motoristaNome.toLowerCase().includes(filtroNome.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Formulário de Registro */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <PlayCircle className="w-6 h-6 text-green-400" />
          Iniciar Nova Jornada
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="motorista">Motorista</Label>
            <Select value={motoristaSelecionado} onValueChange={setMotoristaSelecionado}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Selecione o motorista" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {motoristas.map((motorista) => (
                  <SelectItem key={motorista.id} value={motorista.id}>
                    {motorista.nomeCompleto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caminhao">Caminhão</Label>
            <Input
              id="caminhao"
              placeholder="Ex: Caminhão 01, Placa ABC-1234"
              value={caminhao}
              onChange={(e) => setCaminhao(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="inicio">Início da Jornada</Label>
            <Input
              id="inicio"
              type="datetime-local"
              value={inicioJornada}
              onChange={(e) => setInicioJornada(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
        </div>

        <Button onClick={iniciarJornada} className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold">
          <PlayCircle className="w-5 h-5 mr-2" />
          Iniciar Jornada
        </Button>
      </Card>

      {/* Filtro de Pesquisa */}
      {jornadasEmAndamento.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Filtrar por nome do motorista..."
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
        </Card>
      )}

      {/* Lista de Jornadas Ativas */}
      {jornadasEmAndamento.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-8 sm:p-12">
          <div className="text-center space-y-4">
            <Calendar className="w-16 h-16 mx-auto text-slate-600" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Nenhuma jornada em andamento</h3>
              <p className="text-slate-400">Inicie uma nova jornada usando o formulário acima</p>
            </div>
          </div>
        </Card>
      ) : jornadasFiltradas.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-8 sm:p-12">
          <div className="text-center space-y-4">
            <Search className="w-16 h-16 mx-auto text-slate-600" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Nenhuma jornada encontrada</h3>
              <p className="text-slate-400">Tente ajustar o filtro de pesquisa</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-400" />
            Jornadas em Andamento ({jornadasFiltradas.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jornadasFiltradas.map((jornada) => (
              <Card key={jornada.id} className="bg-blue-900/20 border-blue-500/50 backdrop-blur-sm p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/20">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{jornada.motoristaNome}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Truck className="w-4 h-4" />
                          <span>{jornada.caminhao}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                      Em Jornada
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Início:</span>
                      <span className="font-semibold">{formatarData(jornada.inicioJornada)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">
                        Tempo de jornada:
                      </span>
                      <span className="text-xl font-bold text-blue-400">
                        {calcularTempoJornada(jornada.inicioJornada, jornada.fimJornada)}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Finalizar */}
                  <div className="pt-4 border-t border-slate-700">
                    <Button
                      onClick={() => abrirDialogFinalizar(jornada.id)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Finalizar Jornada
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog para Finalizar Jornada */}
      <Dialog open={dialogFinalizarAberto} onOpenChange={setDialogFinalizarAberto}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <StopCircle className="w-6 h-6 text-orange-400" />
              Finalizar Jornada
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Insira a data e hora de término da jornada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="fimJornada">Data e Hora de Término</Label>
              <Input
                id="fimJornada"
                type="datetime-local"
                value={fimJornadaInput}
                onChange={(e) => setFimJornadaInput(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setDialogFinalizarAberto(false)} 
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button 
                onClick={finalizarJornada} 
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Motorista com Jornada em Andamento */}
      <Dialog open={dialogMotoristaEmJornadaAberto} onOpenChange={setDialogMotoristaEmJornadaAberto}>
        <DialogContent className="bg-gradient-to-br from-red-900 to-red-800 border-red-500 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="w-8 h-8 text-red-400" />
              Jornada em Andamento!
            </DialogTitle>
            <DialogDescription className="text-red-200 text-lg pt-4">
              O motorista <strong>{motoristaBloqueado}</strong> já possui uma jornada em andamento.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border-2 border-red-500/50">
            <p className="text-center text-red-200">
              Não é possível iniciar uma nova jornada para este motorista até que a jornada atual seja finalizada.
            </p>
          </div>
          <Button onClick={() => setDialogMotoristaEmJornadaAberto(false)} className="mt-4 bg-red-600 hover:bg-red-700">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog de Senha Gerada */}
      <Dialog open={dialogSenhaAberto} onOpenChange={setDialogSenhaAberto}>
        <DialogContent className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Key className="w-8 h-8 text-cyan-400" />
              Senha Gerada com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-blue-200 text-lg pt-4">
              A jornada foi finalizada e uma senha de acesso foi gerada automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 p-6 bg-slate-900/50 rounded-lg border-2 border-cyan-500/50">
            <p className="text-center text-slate-300 mb-2">Senha de Acesso:</p>
            <p className="text-center text-5xl font-bold text-cyan-400 tracking-widest">{senhaGerada}</p>
          </div>
          <p className="text-sm text-blue-200 text-center mt-4">
            Anote esta senha. Ela será necessária para acessar informações da jornada.
          </p>
          <Button onClick={() => setDialogSenhaAberto(false)} className="mt-4 bg-blue-600 hover:bg-blue-700">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog de Tempo Insuficiente */}
      <Dialog open={dialogTempoAberto} onOpenChange={setDialogTempoAberto}>
        <DialogContent className="bg-gradient-to-br from-orange-900 to-orange-800 border-orange-500 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="w-8 h-8 text-orange-400" />
              Atenção: Tempo Insuficiente
            </DialogTitle>
            <DialogDescription className="text-orange-200 text-lg pt-4">
              A jornada registrada possui duração inferior a <strong>08:48 minutos</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border-2 border-orange-500/50">
            <p className="text-center text-orange-200">
              Verifique se os horários estão corretos. O tempo mínimo recomendado para uma jornada é de 08:48 minutos.
            </p>
          </div>
          <Button onClick={() => setDialogTempoAberto(false)} className="mt-4 bg-orange-600 hover:bg-orange-700">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
