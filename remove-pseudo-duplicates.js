const { Pool } = require('pg');
const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT;
const config = require(isProduction ? './config.production' : './config');

async function removePseudoDuplicates() {
    const pool = new Pool(config.dbConfig);
    const client = await pool.connect();

    try {
        console.log('🗑️ Начинаем удаление истинных псевдо-дубликатов (одинаковые описания)...\n');

        // Категории с псевдо-дубликатами
        const pseudoDuplicateCategories = [
            'coin',      // Монеты
            'other',     // Прочее
            'banknote'   // Банкноты
        ];

        let totalRemoved = 0;

        for (const category of pseudoDuplicateCategories) {
            console.log(`🏷️ Обрабатываем категорию: ${category}`);
            
            // Находим дубликаты для этой категории (одинаковые описания)
            const duplicateQuery = `
                SELECT 
                    original_description,
                    COUNT(*) as count,
                    STRING_AGG(id::text, ', ' ORDER BY id) as ids,
                    MIN(id) as keep_id
                FROM coin_catalog 
                WHERE category = $1
                GROUP BY original_description
                HAVING COUNT(*) > 1
                ORDER BY count DESC
            `;

            const duplicateResult = await client.query(duplicateQuery, [category]);
            
            if (duplicateResult.rows.length === 0) {
                console.log('   ✅ Дубликатов не найдено');
                continue;
            }

            console.log(`   🔍 Найдено ${duplicateResult.rows.length} групп дубликатов`);

            let categoryRemoved = 0;
            let processedGroups = 0;

            for (const group of duplicateResult.rows) {
                const count = parseInt(group.count);
                const toRemove = count - 1; // Оставляем одну запись
                const idsToRemove = group.ids.split(', ').slice(1); // Удаляем все кроме первой

                if (idsToRemove.length > 0) {
                    // Удаляем дубликаты
                    const deleteQuery = `
                        DELETE FROM coin_catalog 
                        WHERE id = ANY($1::int[])
                    `;
                    
                    await client.query(deleteQuery, [idsToRemove]);
                    categoryRemoved += toRemove;
                }

                processedGroups++;
                
                if (processedGroups % 100 === 0) {
                    console.log(`     📈 Обработано групп: ${processedGroups}/${duplicateResult.rows.length}`);
                }
            }

            console.log(`   ✅ Удалено ${categoryRemoved} записей из категории ${category}`);
            totalRemoved += categoryRemoved;
        }

        console.log(`\n🎉 Удаление истинных псевдо-дубликатов завершено!`);
        console.log(`📊 Всего удалено записей: ${totalRemoved}`);

        // Проверим итоговую статистику
        console.log(`\n📈 Итоговая статистика по категориям:`);
        const statsQuery = `
            SELECT 
                category,
                COUNT(*) as count
            FROM coin_catalog 
            GROUP BY category
            ORDER BY count DESC
        `;
        
        const statsResult = await client.query(statsQuery);
        statsResult.rows.forEach(row => {
            console.log(`   ${row.category}: ${row.count} записей`);
        });

        const totalRemaining = statsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        console.log(`\n📊 Всего записей в каталоге: ${totalRemaining}`);

        // Проверим, сколько осталось дубликатов
        console.log(`\n🔍 Проверка оставшихся дубликатов:`);
        const remainingDuplicatesQuery = `
            SELECT 
                category,
                COUNT(*) as duplicate_groups,
                SUM(count - 1) as records_to_remove
            FROM (
                SELECT 
                    category,
                    original_description,
                    COUNT(*) as count
                FROM coin_catalog 
                GROUP BY category, original_description
                HAVING COUNT(*) > 1
            ) as duplicates
            GROUP BY category
            ORDER BY records_to_remove DESC
        `;
        
        const remainingDuplicatesResult = await client.query(remainingDuplicatesQuery);
        if (remainingDuplicatesResult.rows.length > 0) {
            console.log('   Оставшиеся дубликаты:');
            remainingDuplicatesResult.rows.forEach(row => {
                console.log(`   ${row.category}: ${row.duplicate_groups} групп, ${row.records_to_remove} записей к удалению`);
            });
        } else {
            console.log('   ✅ Дубликатов не осталось!');
        }

    } catch (error) {
        console.error('❌ Ошибка при удалении псевдо-дубликатов:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

removePseudoDuplicates();
