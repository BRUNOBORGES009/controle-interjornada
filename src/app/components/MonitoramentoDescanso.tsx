"use client"

import { useState, useEffect } from "react"
import { Clock, User, Truck, AlertCircle, Key, Calendar, CheckCircle, Edit } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

interface JornadaArquivada {
  id: string
  motoristaId: string
  motoristaNome: string
  caminhao: string
  inicioJornada: string
  fimJornada: string
  inicioDescanso: string
  fimDescansoObrigatorio: string
  senha: string
  dataArquivamento: string
}

export default function MonitoramentoDescanso() {
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [notificacaoAberta, setNotificacaoAberta] = useState(false)
  const [motoristaNotificado, setMotoristaNotificado] = useState("")
  const [tempoAtual, setTempoAtual] = useState(new Date())
  const [dialogConcluirAberto, setDialogConcluirAberto] = useState(false)
  const [jornadaParaConcluir, setJornadaParaConcluir] = useState<Jornada | null>(null)
  const [senhaInput, setSenhaInput] = useState("")
  const [erroSenha, setErroSenha] = useState(false)
  
  // Estados para edição
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false)
  const [jornadaParaEditar, setJornadaParaEditar] = useState<Jornada | null>(null)
  const [fimJornadaEdit, setFimJornadaEdit] = useState("")
  const [inicioDescansoEdit, setInicioDescansoEdit] = useState("")

  // Carregar jornadas do localStorage
  useEffect(() => {
    const jornadasSalvas = localStorage.getItem("jornadas")
    if (jornadasSalvas) {
      setJornadas(JSON.parse(jornadasSalvas))
    }
  }, [])

  // Atualizar jornadas quando houver mudanças no localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const jornadasSalvas = localStorage.getItem("jornadas")
      if (jornadasSalvas) {
        setJornadas(JSON.parse(jornadasSalvas))
      }
    }, 5000) // Atualizar a cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  // Atualizar tempo atual a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoAtual(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Verificar e atualizar status para liberado em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const agora = new Date()
      let houveMudanca = false
      
      const jornadasAtualizadas = jornadas.map((jornada) => {
        if (jornada.status === "descansando" && jornada.fimDescansoObrigatorio) {
          const fimDescanso = new Date(jornada.fimDescansoObrigatorio)
          const tempoRestante = fimDescanso.getTime() - agora.getTime()
          
          // Atualizar status para liberado quando tempo restante <= 0
          if (tempoRestante <= 0) {
            houveMudanca = true
            
            // Mostrar notificação apenas uma vez
            if (jornada.status === "descansando") {
              setMotoristaNotificado(jornada.motoristaNome)
              setNotificacaoAberta(true)
            }
            
            return { ...jornada, status: "liberado" as const }
          }
        }
        return jornada
      })
      
      if (houveMudanca) {
        setJornadas(jornadasAtualizadas)
        localStorage.setItem("jornadas", JSON.stringify(jornadasAtualizadas))
      }
    }, 1000) // Verificar a cada segundo para atualização em tempo real

    return () => clearInterval(interval)
  }, [jornadas])

  const calcularTempoRestante = (fimDescanso: string | null) => {
    if (!fimDescanso) return "N/A"
    
    const agora = tempoAtual
    const fim = new Date(fimDescanso)
    const diff = fim.getTime() - agora.getTime()

    if (diff <= 0) return "Liberado!"

    const horas = Math.floor(diff / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const segundos = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${horas}h ${minutos}min ${segundos}s`
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

  const formatarDataParaInput = (data: string | null) => {
    if (!data) return ""
    const d = new Date(data)
    const ano = d.getFullYear()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    const hora = String(d.getHours()).padStart(2, '0')
    const minuto = String(d.getMinutes()).padStart(2, '0')
    return `${ano}-${mes}-${dia}T${hora}:${minuto}`
  }

  const abrirDialogEditar = (jornada: Jornada) => {
    setJornadaParaEditar(jornada)
    setFimJornadaEdit(formatarDataParaInput(jornada.fimJornada))
    setInicioDescansoEdit(formatarDataParaInput(jornada.inicioDescanso))
    setDialogEditarAberto(true)
  }

  const salvarEdicao = () => {
    if (!jornadaParaEditar) return

    // Calcular novo fim de descanso obrigatório (11h 2min após início do descanso)
    const novoInicioDescanso = new Date(inicioDescansoEdit)
    const novoFimDescanso = new Date(novoInicioDescanso.getTime() + (11 * 60 + 2) * 60 * 1000)

    // Atualizar jornada
    const jornadasAtualizadas = jornadas.map(j => 
      j.id === jornadaParaEditar.id 
        ? { 
            ...j, 
            fimJornada: fimJornadaEdit,
            inicioDescanso: inicioDescansoEdit,
            fimDescansoObrigatorio: novoFimDescanso.toISOString()
          } 
        : j
    )
    
    setJornadas(jornadasAtualizadas)
    localStorage.setItem("jornadas", JSON.stringify(jornadasAtualizadas))
    
    // Fechar dialog
    setDialogEditarAberto(false)
    setJornadaParaEditar(null)
  }

  const abrirDialogConcluir = (jornada: Jornada) => {
    setJornadaParaConcluir(jornada)
    setSenhaInput("")
    setErroSenha(false)
    setDialogConcluirAberto(true)
  }

  const concluirEnvioSenha = () => {
    if (!jornadaParaConcluir) return

    // Validar senha
    if (senhaInput !== jornadaParaConcluir.senha) {
      setErroSenha(true)
      return
    }

    // Criar objeto de jornada arquivada
    const jornadaArquivada: JornadaArquivada = {
      id: jornadaParaConcluir.id,
      motoristaId: jornadaParaConcluir.motoristaId,
      motoristaNome: jornadaParaConcluir.motoristaNome,
      caminhao: jornadaParaConcluir.caminhao,
      inicioJornada: jornadaParaConcluir.inicioJornada,
      fimJornada: jornadaParaConcluir.fimJornada!,
      inicioDescanso: jornadaParaConcluir.inicioDescanso!,
      fimDescansoObrigatorio: jornadaParaConcluir.fimDescansoObrigatorio!,
      senha: jornadaParaConcluir.senha!,
      dataArquivamento: new Date().toISOString()
    }

    // Adicionar ao arquivo de jornadas
    const arquivoAtual = localStorage.getItem("jornadasArquivadas")
    const jornadasArquivadas: JornadaArquivada[] = arquivoAtual ? JSON.parse(arquivoAtual) : []
    jornadasArquivadas.push(jornadaArquivada)
    localStorage.setItem("jornadasArquivadas", JSON.stringify(jornadasArquivadas))

    // Remover jornada da lista ativa após confirmação
    const jornadasAtualizadas = jornadas.filter(j => j.id !== jornadaParaConcluir.id)
    setJornadas(jornadasAtualizadas)
    localStorage.setItem("jornadas", JSON.stringify(jornadasAtualizadas))

    // Fechar dialog
    setDialogConcluirAberto(false)
    setJornadaParaConcluir(null)
    setSenhaInput("")
    setErroSenha(false)
  }

  // Filtrar apenas jornadas em descanso ou liberadas
  const jornadasEmDescanso = jornadas.filter(
    j => j.status === "descansando" || j.status === "liberado"
  )

  return (
    <div className="space-y-6">
      {/* Header da Tela */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-700 backdrop-blur-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Monitoramento de Descanso</h2>
            <p className="text-purple-200">Acompanhe o período de descanso obrigatório dos motoristas</p>
          </div>
        </div>
      </Card>

      {/* Lista de Jornadas em Descanso */}
      {jornadasEmDescanso.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-8 sm:p-12">
          <div className="text-center space-y-4">
            <Calendar className="w-16 h-16 mx-auto text-slate-600" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Nenhuma jornada em descanso</h3>
              <p className="text-slate-400">Quando uma jornada for finalizada, ela aparecerá aqui para monitoramento</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-purple-400" />
            Motoristas em Descanso ({jornadasEmDescanso.length})
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jornadasEmDescanso.map((jornada) => (
              <Card key={jornada.id} className={`border-2 backdrop-blur-sm p-6 ${
                jornada.status === "liberado" 
                  ? "bg-green-900/20 border-green-500/50 shadow-lg shadow-green-500/20" 
                  : "bg-purple-900/20 border-purple-500/50"
              }`}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        jornada.status === "liberado" 
                          ? "bg-green-500/20" 
                          : "bg-purple-500/20"
                      }`}>
                        <User className={`w-6 h-6 ${
                          jornada.status === "liberado" 
                            ? "text-green-400" 
                            : "text-purple-400"
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{jornada.motoristaNome}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Truck className="w-4 h-4" />
                          <span>{jornada.caminhao}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        jornada.status === "liberado" 
                          ? "bg-green-500/20 text-green-400 animate-pulse" 
                          : "bg-purple-500/20 text-purple-400"
                      }`}>
                        {jornada.status === "liberado" ? "✓ Liberado" : "Em Descanso"}
                      </span>
                      <Button
                        onClick={() => abrirDialogEditar(jornada)}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Início do Descanso:</span>
                      <span className="font-semibold">{formatarData(jornada.inicioDescanso)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Liberação Prevista:</span>
                      <span className="font-semibold">{formatarData(jornada.fimDescansoObrigatorio)}</span>
                    </div>
                    {jornada.senha && (
                      <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-slate-700">
                        <span className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-cyan-400" />
                          Senha:
                        </span>
                        <span className="font-bold text-cyan-400 text-lg tracking-wider">{jornada.senha}</span>
                      </div>
                    )}
                  </div>

                  {/* Contador de Tempo */}
                  <div className="pt-4 border-t border-slate-700">
                    <div className="text-center space-y-2">
                      <span className="text-slate-400 text-sm block">
                        {jornada.status === "liberado" ? "Motorista Liberado!" : "Tempo Restante de Descanso"}
                      </span>
                      <div className={`text-3xl font-bold ${
                        jornada.status === "liberado" 
                          ? "text-green-400" 
                          : "text-purple-400"
                      }`}>
                        {calcularTempoRestante(jornada.fimDescansoObrigatorio)}
                      </div>
                      {jornada.status === "liberado" && (
                        <p className="text-green-400 text-sm animate-pulse">
                          ✓ Motorista pode iniciar nova jornada
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  {jornada.status === "descansando" && jornada.inicioDescanso && jornada.fimDescansoObrigatorio && (
                    <div className="space-y-2">
                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(100, Math.max(0, 
                              ((new Date().getTime() - new Date(jornada.inicioDescanso).getTime()) / 
                              (new Date(jornada.fimDescansoObrigatorio).getTime() - new Date(jornada.inicioDescanso).getTime())) * 100
                            ))}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 text-center">
                        Progresso do descanso obrigatório (11h 2min)
                      </p>
                    </div>
                  )}

                  {/* Botão de Concluir Envio de Senha - SEMPRE VISÍVEL quando liberado */}
                  {jornada.status === "liberado" && (
                    <div className="pt-4 border-t border-green-700/50">
                      <Button
                        onClick={() => abrirDialogConcluir(jornada)}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6 text-lg shadow-lg shadow-green-500/30"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Concluir Envio de Senha
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de Editar Jornada */}
      <Dialog open={dialogEditarAberto} onOpenChange={setDialogEditarAberto}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Edit className="w-6 h-6 text-purple-400" />
              Editar Jornada
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Edite as informações da jornada em descanso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="fimJornadaEdit">Fim da Jornada</Label>
              <Input
                id="fimJornadaEdit"
                type="datetime-local"
                value={fimJornadaEdit}
                onChange={(e) => setFimJornadaEdit(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inicioDescansoEdit">Início do Descanso</Label>
              <Input
                id="inicioDescansoEdit"
                type="datetime-local"
                value={inicioDescansoEdit}
                onChange={(e) => setInicioDescansoEdit(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400">
                O fim do descanso será calculado automaticamente (11h 2min após o início)
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => setDialogEditarAberto(false)} 
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button 
                onClick={salvarEdicao} 
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Concluir Envio de Senha */}
      <Dialog open={dialogConcluirAberto} onOpenChange={setDialogConcluirAberto}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Concluir Envio de Senha
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Digite a senha para confirmar o envio e arquivar a jornada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="senhaConfirmacao">Senha de Confirmação</Label>
              <Input
                id="senhaConfirmacao"
                type="text"
                placeholder="Digite a senha de 4 dígitos"
                value={senhaInput}
                onChange={(e) => {
                  setSenhaInput(e.target.value)
                  setErroSenha(false)
                }}
                className={`bg-slate-900 border-slate-700 text-white ${
                  erroSenha ? "border-red-500" : ""
                }`}
                maxLength={4}
              />
              {erroSenha && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Senha incorreta. Tente novamente.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setDialogConcluirAberto(false)
                  setSenhaInput("")
                  setErroSenha(false)
                }} 
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button 
                onClick={concluirEnvioSenha} 
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notificação Pop-up - 11h e 2min completados */}
      <Dialog open={notificacaoAberta} onOpenChange={setNotificacaoAberta}>
        <DialogContent className="bg-gradient-to-br from-green-900 to-green-800 border-green-500 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="w-8 h-8 text-green-400 animate-bounce" />
              🎉 Motorista Liberado!
            </DialogTitle>
            <DialogDescription className="text-green-200 text-lg pt-4">
              O motorista <strong className="text-white text-xl">{motoristaNotificado}</strong> completou as <strong className="text-white">11 horas e 2 minutos</strong> de descanso obrigatório!
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 p-6 bg-slate-900/50 rounded-lg border-2 border-green-500/50">
            <p className="text-center text-green-200 text-lg">
              ✓ O motorista está <strong className="text-white">LIBERADO</strong> para iniciar uma nova jornada!
            </p>
          </div>
          <Button 
            onClick={() => setNotificacaoAberta(false)} 
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg py-6"
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
