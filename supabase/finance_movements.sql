create table if not exists public.finance_movements (
	id uuid primary key default gen_random_uuid(),
	type text not null check (type in ('income', 'expense')),
	description text not null,
	amount numeric(12, 2) not null check (amount > 0),
	category text,
	created_at timestamptz not null default now()
);

alter table public.finance_movements enable row level security;

drop policy if exists "Public can read finance demo movements"
	on public.finance_movements;

revoke all on table public.finance_movements from anon, authenticated;

-- The portfolio demo now stores movements in the visitor's browser. Keep this
-- table private if legacy demo data must be retained for administrative review.

insert into public.finance_movements (type, description, amount, category)
select type, description, amount, category
from (
	values
		('income', 'Nomina demo', 1850.00, 'Ingresos'),
		('expense', 'Alquiler demo', 650.00, 'Vivienda'),
		('expense', 'Supermercado demo', 86.40, 'Comida'),
		('income', 'Proyecto freelance demo', 420.00, 'Extra')
) as seed(type, description, amount, category)
where not exists (
	select 1
	from public.finance_movements
);
