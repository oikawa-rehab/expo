export const UIEngine = {
    // 1. ConfigからHTMLフォームを生成する
    renderForm: (fields) => {
        const form = document.createElement('div');
        form.id = 'tm-custom-form';
        form.className = 'p-4 border rounded bg-white shadow-sm space-y-4';
        console.log(fields);
        

        fields.forEach(field => {
            const fieldWrapper = document.createElement('div');
            fieldWrapper.className = 'field-group border-b pb-2';
            
            let html = `<p class="font-bold text-gray-700 mb-1">${field.label}</p>`;
            
            if (field.type === 'radio' || field.type === 'checkbox') {
                field.options.forEach(opt => {
                    html += `
                        <label class="inline-flex items-center mr-3 cursor-pointer">
                            <input type="${field.type}" name="${field.id}" value="${opt}" class="mr-1">
                            <span>${opt}</span>
                        </label>`;
                });
            } else if (field.type === 'textarea') {
                html += `<textarea name="${field.id}" class="w-full border p-2 h-24 rounded bg-gray-50"></textarea>`;
            }
            
            fieldWrapper.innerHTML = html;
            form.appendChild(fieldWrapper);
        });

        return form;
    },

    // 2. フォームから現在の値を一括取得する
    getValues: (formElement, fields) => {
        const data = {};
        fields.forEach(field => {
            if (field.type === 'radio') {
                data[field.id] = formElement.querySelector(`input[name="${field.id}"]:checked`)?.value || "";
            } else if (field.type === 'checkbox') {
                data[field.id] = Array.from(formElement.querySelectorAll(`input[name="${field.id}"]:checked`)).map(el => el.value);
            } else if (field.type === 'textarea') {
                data[field.id] = formElement.querySelector(`textarea[name="${field.id}"]`)?.value || "";
            }
        });
        return data;
    }
};