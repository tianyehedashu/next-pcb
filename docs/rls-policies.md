# Supabase RLS Policies for pcb_quotes & admin_orders

## admin_orders
- **管理员**（profiles.role = 'admin'）拥有全部操作权限（增删查改）。
- **普通用户**只能查看（SELECT）user_id 等于自己（auth.uid()）的数据。

```sql
-- 管理员全部权限
CREATE POLICY "Admin full access to admin_orders" ON public.admin_orders
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 用户只能查自己的
CREATE POLICY "User can view own admin_orders" ON public.admin_orders
FOR SELECT USING (user_id = auth.uid());
```

## pcb_quotes
- **用户**可以插入（创建）自己的数据（user_id = auth.uid()）。
- **用户**可以查看（SELECT）自己的数据。
- **用户**可以修改（UPDATE）自己的数据。
- **用户**可以删除（DELETE）自己的数据。

```sql
-- 用户可插入自己的
CREATE POLICY "User can insert own pcb_quotes" ON public.pcb_quotes
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 用户可查自己的
CREATE POLICY "User can select own pcb_quotes" ON public.pcb_quotes
FOR SELECT USING (user_id = auth.uid());

-- 用户可改自己的
CREATE POLICY "User can update own pcb_quotes" ON public.pcb_quotes
FOR UPDATE USING (user_id = auth.uid());

-- 用户可删自己的
CREATE POLICY "User can delete own pcb_quotes" ON public.pcb_quotes
FOR DELETE USING (user_id = auth.uid());
``` 