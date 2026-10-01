import React, { useState } from 'react';
import { Employee, EmployeeRole, StoreSettings } from '../types';
import {
  Users,
  UserPlus,
  Flame,
  UtensilsCrossed,
  Receipt,
  ShieldCheck,
  User,
  Phone,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  Search,
  MessageCircle,
  Wallet,
  Sparkles,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface EmployeeManagementViewProps {
  storeSettings: StoreSettings;
  onUpdateStoreSettings: (newSettings: StoreSettings) => void;
}

export const EmployeeManagementView: React.FC<EmployeeManagementViewProps> = ({
  storeSettings,
  onUpdateStoreSettings,
}) => {
  // Only internal restaurant staff (motoboys/entregadores are managed in the dedicated 'Entregadores & Motoboys' tab)
  const employees: Employee[] = (storeSettings.employees || []).filter(
    e => (e.role as string) !== 'motoboy'
  );

  const [filterRole, setFilterRole] = useState<'all' | EmployeeRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<EmployeeRole>('garcom');
  const [formCustomTitle, setFormCustomTitle] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPixKey, setFormPixKey] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formShift, setFormShift] = useState<'manha' | 'tarde' | 'noite' | 'integral'>('noite');
  const [formSalary, setFormSalary] = useState('');
  const [formSalaryType, setFormSalaryType] = useState<'diaria' | 'mensal'>('diaria');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open modal for new employee
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormRole('garcom');
    setFormCustomTitle('Garçom / Atendimento');
    setFormPhone('');
    setFormEmail('');
    setFormPixKey('');
    setFormActive(true);
    setFormShift('noite');
    setFormSalary('80');
    setFormSalaryType('diaria');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormRole(emp.role);
    setFormCustomTitle(emp.customRoleTitle || '');
    setFormPhone(emp.phone);
    setFormEmail(emp.email || '');
    setFormPixKey(emp.pixKey || '');
    setFormActive(emp.active);
    setFormShift(emp.shift || 'noite');
    setFormSalary(emp.salary ? String(emp.salary) : '');
    setFormSalaryType(emp.salaryType || 'diaria');
    setFormNotes(emp.notes || '');
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Por favor, informe o nome do colaborador.');
      return;
    }

    const salaryNum = parseFloat(formSalary.replace(',', '.')) || 0;

    if (editingEmployee) {
      // Update
      const updated = employees.map(emp => {
        if (emp.id === editingEmployee.id) {
          return {
            ...emp,
            name: formName.trim(),
            role: formRole,
            customRoleTitle: formCustomTitle.trim() || undefined,
            phone: formPhone.trim(),
            email: formEmail.trim() || undefined,
            pixKey: formPixKey.trim() || undefined,
            active: formActive,
            shift: formShift,
            salary: salaryNum,
            salaryType: formSalaryType,
            notes: formNotes.trim() || undefined,
          };
        }
        return emp;
      });

      onUpdateStoreSettings({ ...storeSettings, employees: updated });
      showToast(`Cadastro de ${formName} atualizado com sucesso!`);
    } else {
      // Create New
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: formName.trim(),
        role: formRole,
        customRoleTitle: formCustomTitle.trim() || undefined,
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        pixKey: formPixKey.trim() || undefined,
        active: formActive,
        shift: formShift,
        salary: salaryNum,
        salaryType: formSalaryType,
        registeredAt: new Date().toLocaleDateString('pt-BR'),
        notes: formNotes.trim() || undefined,
      };

      onUpdateStoreSettings({
        ...storeSettings,
        employees: [...employees, newEmp],
      });
      showToast(`Funcionário ${formName} cadastrado com sucesso! 🎉`);
    }

    setIsModalOpen(false);
  };

  // Toggle active status (no plantão)
  const handleToggleActive = (empId: string) => {
    const updated = employees.map(emp => {
      if (emp.id === empId) {
        const next = !emp.active;
        showToast(`${emp.name}: ${next ? 'Colocado no plantão de hoje 🟢' : 'Colocado em folga ⏸️'}`);
        return { ...emp, active: next };
      }
      return emp;
    });
    onUpdateStoreSettings({ ...storeSettings, employees: updated });
  };

  // Delete employee
  const handleDelete = (empId: string) => {
    const target = employees.find(e => e.id === empId);
    const updated = employees.filter(e => e.id !== empId);
    onUpdateStoreSettings({ ...storeSettings, employees: updated });
    setIsDeleteModalOpen(false);
    setEmployeeToDelete(null);
    showToast(`Funcionário ${target?.name || ''} removido da equipe.`);
  };

  // Helpers for Roles styling
  const getRoleBadge = (role: EmployeeRole, customTitle?: string) => {
    switch (role) {
      case 'garcom':
        return {
          label: customTitle || 'Garçom / Salão',
          icon: UtensilsCrossed,
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotBg: 'bg-amber-400',
        };
      case 'chapeiro':
        return {
          label: customTitle || 'Chapeiro / Parrillero',
          icon: Flame,
          bg: 'bg-[#ff5722]/20 text-[#ff8a65] border-[#ff5722]/40',
          dotBg: 'bg-[#ff5722]',
        };
      case 'cozinha':
        return {
          label: customTitle || 'Cozinha & Preparo',
          icon: Flame,
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          dotBg: 'bg-orange-400',
        };
      case 'atendente':
        return {
          label: customTitle || 'Atendimento & Balcão',
          icon: Receipt,
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotBg: 'bg-emerald-400',
        };
      case 'caixa':
        return {
          label: customTitle || 'Caixa & Fechamento',
          icon: Receipt,
          bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          dotBg: 'bg-teal-400',
        };
      case 'gerente':
        return {
          label: customTitle || 'Gerente / Supervisor',
          icon: ShieldCheck,
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dotBg: 'bg-blue-400',
        };
      default:
        return {
          label: customTitle || 'Equipe Geral',
          icon: User,
          bg: 'bg-[#353535] text-white border-[#555]',
          dotBg: 'bg-gray-400',
        };
    }
  };

  // Metrics
  const totalEmployees = employees.length;
  const onDutyCount = employees.filter(e => e.active).length;
  const offDutyCount = employees.filter(e => !e.active).length;
  const totalDailyTurnCosts = employees
    .filter(e => e.active && e.salaryType === 'diaria')
    .reduce((sum, e) => sum + (e.salary || 0), 0);

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchRole = filterRole === 'all' || emp.role === filterRole;
    const matchSearch =
      !searchQuery.trim() ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.customRoleTitle && emp.customRoleTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      emp.phone.includes(searchQuery);
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-lg text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#201d1c] via-[#241f1c] to-[#1c1a19] p-5 rounded-xl border border-[#ff5722]/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#ff5722]/20 border border-[#ff5722]/40 text-[#ff5722] flex items-center justify-center flex-shrink-0 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-['Montserrat'] font-bold text-lg text-white">
                Cadastro de Funcionários & Funções
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold uppercase">
                {onDutyCount} no plantão hoje
              </span>
            </div>
            <p className="text-xs text-[#b4b5b5] mt-1">
              Cadastre garçons, chapeiros, auxiliares de cozinha, caixas e gerentes com seus respectivos turnos e diárias.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-flame text-white px-4 py-2.5 rounded-lg font-['Montserrat'] font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Cadastrar Funcionário</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1c1b1b] p-3.5 rounded-xl border border-[#353535] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8e8f8f] uppercase block font-['Montserrat']">
              Total de Colaboradores
            </span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">{totalEmployees}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#353535]/50 text-white flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#1c1b1b] p-3.5 rounded-xl border border-emerald-500/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase block font-['Montserrat']">
              No Plantão Hoje (Ativos)
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">{onDutyCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#1c1b1b] p-3.5 rounded-xl border border-[#353535] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8e8f8f] uppercase block font-['Montserrat']">
              Em Folga / Inativos
            </span>
            <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">{offDutyCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#1c1b1b] p-3.5 rounded-xl border border-[#ff5722]/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#ff8a65] uppercase block font-['Montserrat']">
              Custo Estimado Diárias
            </span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">
              R$ {totalDailyTurnCosts.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#ff5722]/20 text-[#ff5722] flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#1c1b1b] p-3 rounded-xl border border-[#353535]">
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'garcom', label: 'Garçons' },
            { id: 'chapeiro', label: 'Chapeiros' },
            { id: 'cozinha', label: 'Cozinha' },
            { id: 'atendente', label: 'Atendentes' },
            { id: 'caixa', label: 'Caixa' },
            { id: 'gerente', label: 'Gerência' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterRole(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold whitespace-nowrap transition-all ${
                filterRole === tab.id
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'bg-[#252525] text-[#b4b5b5] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8e8f8f] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou fone..."
            className="w-full bg-[#121212] border border-[#353535] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#8e8f8f] focus:outline-none focus:border-[#ff5722]"
          />
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const badge = getRoleBadge(emp.role, emp.customRoleTitle);
          const BadgeIcon = badge.icon;
          const cleanPhone = emp.phone.replace(/\D/g, '');

          return (
            <div
              key={emp.id}
              className={`bg-[#1c1b1b] rounded-2xl border p-4.5 flex flex-col justify-between transition-all shadow-lg hover:shadow-2xl space-y-3 ${
                emp.active
                  ? 'border-[#353535] hover:border-[#ff5722]/50'
                  : 'border-[#353535]/50 opacity-70 hover:opacity-100 bg-[#161616]'
              }`}
            >
              {/* Card Top: Avatar, Name, Role badge */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-['Montserrat'] font-black text-sm shadow-md border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-['Montserrat'] font-bold text-sm text-white block">
                        {emp.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotBg}`} />
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Active / Off-duty Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(emp.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      emp.active
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-[#252525] text-[#8e8f8f] border-[#404040] hover:text-white'
                    }`}
                    title={emp.active ? 'Clique para colocar em folga' : 'Clique para colocar no plantão'}
                  >
                    {emp.active ? '● No Plantão' : '○ Folga'}
                  </button>
                </div>

                {/* Info Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#141414] p-2 rounded-lg border border-[#353535] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#ff5722] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#8e8f8f] block uppercase font-bold">Turno</span>
                      <span className="text-white font-medium capitalize text-[11px]">
                        {emp.shift === 'manha'
                          ? 'Manhã'
                          : emp.shift === 'tarde'
                          ? 'Tarde'
                          : emp.shift === 'integral'
                          ? 'Integral'
                          : 'Noite'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#141414] p-2 rounded-lg border border-[#353535] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#8e8f8f] block uppercase font-bold">
                        {emp.salaryType === 'mensal' ? 'Salário Mês' : 'Diária'}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold text-[11px]">
                        {emp.salary ? `R$ ${emp.salary.toFixed(2).replace('.', ',')}` : 'A combinar'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact and Pix */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#b4b5b5] bg-[#141414] p-2 rounded-lg border border-[#353535]">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-[#ff5722]" /> {emp.phone || 'Sem telefone'}
                    </span>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/55${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                  </div>

                  {emp.pixKey && (
                    <div className="text-[10px] text-[#8e8f8f] flex items-center justify-between px-1">
                      <span>Chave Pix:</span>
                      <span className="font-mono text-[#ff8a65] truncate max-w-[170px]">{emp.pixKey}</span>
                    </div>
                  )}

                  {emp.notes && (
                    <p className="text-[10px] text-[#8e8f8f] italic bg-black/20 p-1.5 rounded">
                      "{emp.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer: Edit & Delete Actions */}
              <div className="pt-2 border-t border-[#353535] flex items-center justify-between text-xs">
                <span className="text-[9px] text-[#8e8f8f]">
                  Cadastrado em {emp.registeredAt || '2026'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(emp)}
                    className="p-1.5 text-[#b4b5b5] hover:text-white rounded-lg hover:bg-[#252525] transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title="Editar informações"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#ff8a65]" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeToDelete(emp);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-[#8e8f8f] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Remover colaborador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* MODAL: CADASTRAR OU EDITAR FUNCIONÁRIO                         */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-[#201e1d] border-b border-[#353535] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ff5722]/20 text-[#ff5722] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                    {editingEmployee ? 'Editar Colaborador' : 'Cadastrar Novo Funcionário'}
                  </h3>
                  <span className="text-[11px] text-[#b4b5b5]">
                    Defina a função, dados de contato e diária de trabalho.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8e8f8f] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[#b4b5b5] font-semibold mb-1">
                  Nome Completo do Funcionário *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: Danilo Ribeiro ou Marcos Chapeiro"
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#b4b5b5] font-semibold mb-1">
                    Função Principal / Categoria *
                  </label>
                  <select
                    value={formRole}
                    onChange={e => {
                      const r = e.target.value as EmployeeRole;
                      setFormRole(r);
                      if (!formCustomTitle || formCustomTitle.includes('/')) {
                        const defaults: Record<EmployeeRole, string> = {
                          garcom: 'Garçom Líder de Salão',
                          chapeiro: 'Chapeiro Chefe / Parrillero',
                          cozinha: 'Auxiliar de Cozinha & Montagem',
                          atendente: 'Atendente de Salão & Balcão',
                          caixa: 'Operador de Caixa & Fechamento',
                          gerente: 'Gerente Operacional de Turno',
                          outros: 'Colaborador',
                        };
                        setFormCustomTitle(defaults[r] || '');
                      }
                    }}
                    className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-[#ff5722]"
                  >
                    <option value="garcom">🍽️ Garçom (Salão de Mesas)</option>
                    <option value="chapeiro">🔥 Chapeiro / Grelha de Burgers</option>
                    <option value="cozinha">🍳 Cozinha & Frituras</option>
                    <option value="atendente">🛍️ Atendente de Balcão / Pedidos</option>
                    <option value="caixa">💼 Caixa & Fechamento</option>
                    <option value="gerente">👔 Gerente / Supervisor</option>
                    <option value="outros">✨ Outra Função</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#b4b5b5] font-semibold mb-1">
                    Título / Cargo Personalizado
                  </label>
                  <input
                    type="text"
                    value={formCustomTitle}
                    onChange={e => setFormCustomTitle(e.target.value)}
                    placeholder="Ex: Chefe da Grelha, Garçom Noturno"
                    className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#b4b5b5] font-semibold mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                  />
                </div>

                <div>
                  <label className="block text-[#b4b5b5] font-semibold mb-1">
                    Chave Pix para Pagamentos
                  </label>
                  <input
                    type="text"
                    value={formPixKey}
                    onChange={e => setFormPixKey(e.target.value)}
                    placeholder="CPF, e-mail ou celular pix"
                    className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#ff5722]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#b4b5b5] font-semibold mb-1">
                    Turno de Trabalho
                  </label>
                  <select
                    value={formShift}
                    onChange={e => setFormShift(e.target.value as any)}
                    className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                  >
                    <option value="noite">🌙 Noite (18h - 00h)</option>
                    <option value="tarde">☀️ Tarde (12h - 18h)</option>
                    <option value="manha">🌅 Manhã (08h - 14h)</option>
                    <option value="integral">⚡ Integral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#b4b5b5] font-semibold mb-1">
                    Tipo de Pagamento
                  </label>
                  <select
                    value={formSalaryType}
                    onChange={e => setFormSalaryType(e.target.value as any)}
                    className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                  >
                    <option value="diaria">Por Diária (R$/dia)</option>
                    <option value="mensal">Salário Mensal (R$/mês)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#b4b5b5] font-semibold mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    value={formSalary}
                    onChange={e => setFormSalary(e.target.value)}
                    placeholder="80,00"
                    className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#ff5722]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#141414] rounded-xl border border-[#353535] flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Status no Plantão Hoje</span>
                  <span className="text-[11px] text-[#8e8f8f]">
                    Determina se o colaborador aparece disponível para atender mesas hoje.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    formActive ? 'bg-emerald-500' : 'bg-[#353535]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      formActive ? 'left-6.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-[#b4b5b5] font-semibold mb-1">
                  Observações Internas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ex: Folgas aos domingos, responsável pelas chaves do salão..."
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#353535]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#252525] text-[#b4b5b5] hover:text-white font-bold text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-flame text-white px-5 py-2 rounded-lg font-['Montserrat'] font-bold text-xs shadow-md active:scale-95"
                >
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRMAR EXCLUSÃO                                      */}
      {/* ============================================================== */}
      {isDeleteModalOpen && employeeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                  Remover Funcionário?
                </h3>
                <span className="text-xs text-[#8e8f8f]">{employeeToDelete.name}</span>
              </div>
            </div>

            <p className="text-xs text-[#b4b5b5] bg-[#141414] p-3 rounded-xl border border-[#353535]">
              Tem certeza que deseja remover <strong className="text-white">{employeeToDelete.name}</strong> da equipe? Esta ação não pode ser desfeita.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setEmployeeToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#252525] text-[#b4b5b5] hover:text-white font-bold text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleDelete(employeeToDelete.id)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-['Montserrat'] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/50 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Remover</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
