const axios = require('axios');

async function testVoteAPI() {
  try {
    console.log('=== Test de API de Votación ===\n');

    // 1. Login como Ana Martínez (solicitante de la vacante)
    console.log('1. Iniciando sesión como Ana Martínez...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'ana.martinez@kram.com',
      password: 'password123'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log(`   Token: ${token.substring(0, 30)}...`);
    console.log(`   User ID: ${loginResponse.data.user.id}`);
    console.log(`   User Name: ${loginResponse.data.user.name}`);
    console.log(`   User Role: ${loginResponse.data.user.role}`);

    // 2. Obtener información de la vacante y candidato
    console.log('\n2. Obteniendo información de la vacante...');
    const vacancyResponse = await axios.get('http://localhost:3001/api/recruitment/vacancies/cmmaz0pq5001irnv4vbou9yja', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const vacancy = vacancyResponse.data.vacancy;
    console.log('✅ Vacante obtenida:');
    console.log(`   Título: ${vacancy.titulo}`);
    console.log(`   Estatus: ${vacancy.estatus}`);
    console.log(`   Solicitante: ${vacancy.solicitante?.nombre}`);
    console.log(`   Candidatos: ${vacancy.candidatesRH.length}`);

    if (vacancy.candidatesRH.length === 0) {
      console.log('❌ No hay candidatos para probar');
      return;
    }

    const candidate = vacancy.candidatesRH[0];
    console.log(`\n✅ Candidato para probar:`);
    console.log(`   ID: ${candidate.id}`);
    console.log(`   Nombre: ${candidate.nombre}`);
    console.log(`   Estatus actual: ${candidate.estatus}`);

    // 3. Probar el voto "like"
    console.log('\n3. Probando voto "like"...');
    try {
      const voteResponse = await axios.post(
        `http://localhost:3001/api/recruitment/candidates/${candidate.id}/vote`,
        { vote: 'like' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Voto exitoso!');
      console.log(`   Mensaje: ${voteResponse.data.message}`);
      console.log(`   Nuevo estatus: ${voteResponse.data.candidate.estatus}`);
    } catch (voteError) {
      console.log('❌ Error en el voto:');
      if (voteError.response) {
        console.log(`   Status: ${voteError.response.status}`);
        console.log(`   Error: ${voteError.response.data.error}`);
        console.log(`   Detalles: ${JSON.stringify(voteError.response.data, null, 2)}`);
      } else {
        console.log(`   Error: ${voteError.message}`);
      }
    }

    // 4. Verificar el cambio en el candidato
    console.log('\n4. Verificando estado actualizado del candidato...');
    const updatedVacancyResponse = await axios.get('http://localhost:3001/api/recruitment/vacancies/cmmaz0pq5001irnv4vbou9yja', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const updatedCandidate = updatedVacancyResponse.data.vacancy.candidatesRH.find(c => c.id === candidate.id);
    console.log(`✅ Estado actualizado: ${updatedCandidate.estatus}`);

    // 5. Probar el voto "dislike" (para revertir)
    console.log('\n5. Probando voto "dislike"...');
    try {
      const dislikeResponse = await axios.post(
        `http://localhost:3001/api/recruitment/candidates/${candidate.id}/vote`,
        { vote: 'dislike' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Voto "dislike" exitoso!');
      console.log(`   Mensaje: ${dislikeResponse.data.message}`);
      console.log(`   Nuevo estatus: ${dislikeResponse.data.candidate.estatus}`);
    } catch (dislikeError) {
      console.log('❌ Error en el voto "dislike":');
      if (dislikeError.response) {
        console.log(`   Status: ${dislikeError.response.status}`);
        console.log(`   Error: ${dislikeError.response.data.error}`);
      } else {
        console.log(`   Error: ${dislikeError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error general en el test:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
      console.error('   Response status:', error.response.status);
    }
  }
}

testVoteAPI();