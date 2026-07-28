export type Role = 'admin' | 'professor' | 'recepcionista';

export type Modalidade = 'Jiu-Jitsu' | 'Boxe';

export type StudentStatus = 'Ativo' | 'Inativo' | 'Trancado';

export type PaymentStatus = 'Pago' | 'Pendente' | 'Vencido';

export type PaymentMethod = 'Pix' | 'Dinheiro' | 'Cartão' | 'Transferência';

export type FaixaJiuJitsu =
  | 'Branca'
  | 'Cinza'
  | 'Amarela'
  | 'Laranja'
  | 'Verde'
  | 'Azul'
  | 'Roxa'
  | 'Marrom'
  | 'Preta';

export interface UserProfile {
  uid: string;
  academiaId: string;
  nome: string;
  email: string;
  role: Role;
  fotoUrl?: string;
  createdAt: number;
}

export interface Academia {
  id: string;
  nome: string;
  logoUrl?: string;
  endereco?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  pixChave?: string;
  bancoNome?: string;
  bancoAgencia?: string;
  bancoConta?: string;
  horarioFuncionamento?: string;
  createdAt: number;
  ownerUid: string;
}

export interface Student {
  id: string;
  academiaId: string;
  fotoUrl?: string;
  nomeCompleto: string;
  cpf?: string;
  dataNascimento?: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
  modalidade: Modalidade;
  professorId?: string;
  faixa?: FaixaJiuJitsu;
  graduacao?: string;
  peso?: number;
  categoria?: string;
  dataMatricula: string;
  valorMensalidade: number;
  diaVencimento: number;
  status: StudentStatus;
  observacoes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Teacher {
  id: string;
  academiaId: string;
  fotoUrl?: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  whatsapp?: string;
  especialidade: Modalidade | 'Ambos';
  dataContratacao?: string;
  salario?: number;
  horariosTrabalho?: string;
  observacoes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id: string;
  academiaId: string;
  studentId: string;
  studentNome: string;
  mesReferencia: string; // "2026-07"
  valor: number;
  vencimento: string; // ISO date
  dataPagamento?: string; // ISO date
  formaPagamento?: PaymentMethod;
  status: PaymentStatus;
  observacoes?: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  academiaId: string;
  studentId: string;
  studentNome: string;
  turmaId?: string;
  data: string; // ISO date yyyy-MM-dd
  horario: string; // HH:mm
  metodo: 'Manual' | 'QRCode';
  createdAt: number;
}

export interface ClassSession {
  id: string;
  academiaId: string;
  nome: string;
  modalidade: Modalidade;
  professorId?: string;
  professorNome?: string;
  diasSemana: number[]; // 0=domingo..6=sabado
  horarioInicio: string;
  horarioFim: string;
  limiteAlunos?: number;
  createdAt: number;
}

export type FinanceType = 'Receita' | 'Despesa';

export const DESPESA_CATEGORIAS = [
  'Aluguel',
  'Energia',
  'Água',
  'Equipamentos',
  'Material de limpeza',
  'Uniformes',
  'Marketing',
  'Internet',
  'Salários',
  'Outros',
] as const;

export interface FinanceEntry {
  id: string;
  academiaId: string;
  tipo: FinanceType;
  categoria: string;
  valor: number;
  data: string; // ISO date
  descricao?: string;
  createdAt: number;
}

export interface Notice {
  id: string;
  academiaId: string;
  titulo: string;
  mensagem: string;
  createdAt: number;
}

export interface Invite {
  id: string; // lowercased e-mail, also used as the Firestore document id
  academiaId: string;
  email: string;
  role: Role;
  createdAt: number;
}
