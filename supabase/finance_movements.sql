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

create policy "Public can read finance demo movements"
	on public.finance_movements
	for select
	to anon
	using (true);

-- Public inserts stay disabled. The Astro endpoint uses SUPABASE_SERVICE_ROLE_KEY
-- server-side after validating type, description and amount.

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
