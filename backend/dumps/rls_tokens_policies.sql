-- Politique pour permettre l'accès aux boîtes de médicaments via un token valide dans la session
-- Cette politique utilise une variable de configuration locale 'app.current_token' définie par le backend

-- 1. Politique pour medicine_boxes
CREATE POLICY "Public access via shared token" ON medicine_boxes
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 
        FROM shared_tokens st
        WHERE st.token = current_setting('app.current_token', true)
        AND st.calendar_id = medicine_boxes.calendar_id
    )
);

-- 2. Politique pour medicine_box_conditions
-- On vérifie que la boîte associée est accessible via le token
CREATE POLICY "Public access via shared token" ON medicine_box_conditions
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 
        FROM medicine_boxes box
        JOIN shared_tokens st ON st.calendar_id = box.calendar_id
        WHERE box.id = medicine_box_conditions.box_id
        AND st.token = current_setting('app.current_token', true)
    )
);
