import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

public class LoginServer {

    private static final ObjectMapper mapper = new ObjectMapper();

    // ============================= DTOs =============================
    public static class LoginDTO { public String cpf; public String senha; }
    public static class RegisterDTO { public String nome; public String cpf; public String senha; }
    public static class GastoDTO { public String cpfUsuar; public String des; public String vl; public String dt; public int tp; public int id; }
    public static class EditarGastoDTO { public int id; public String cpfUsuar; public String vl; public String dt; public int tp; public String des;}
    public static class RemoverGastoDTO { public int id; public String cpfUsuar;}
    // ============================= JSON Helpers =============================
    public static <T> T readJson(HttpExchange ex, Class<T> cls) throws Exception {
        return mapper.readValue(ex.getRequestBody(), cls);
    }

    public static void writeJson(HttpExchange ex, Object obj) throws Exception {
        String json = mapper.writeValueAsString(obj);
        ex.getResponseHeaders().add("Content-Type", "application/json");
        ex.sendResponseHeaders(200, json.getBytes().length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(json.getBytes());
        }
    }

    // ============================= CORS Helper =============================
    public static boolean handleCORS(HttpExchange ex) throws Exception {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "*");

        if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            ex.sendResponseHeaders(204, -1);
            return true;
        }
        return false;
    }


    // ============================= MAIN =============================
    public static void main(String[] args) throws Exception {

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        String url = "jdbc:sqlserver://dbfc.database.windows.net:1433;database=FinanCorp;user=otto@dbfc;password=Exc@l!8uR;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;";
        String dbUser = "otto";
        String dbPass = "Exc@l!8uR";


        // ==================================================================
        // LOGIN
        // ==================================================================
        server.createContext("/login", ex -> {
            try {
                if (handleCORS(ex)) return;

                if (!ex.getRequestMethod().equalsIgnoreCase("POST")) {
                    ex.sendResponseHeaders(405, -1);
                    return;
                }

                LoginDTO data = readJson(ex, LoginDTO.class);

                String nome = null;
                String cpf = null;

                try (Connection con = DriverManager.getConnection(url, dbUser, dbPass);
                     PreparedStatement stmt = con.prepareStatement(
                         "SELECT nomeUsuar, cpf FROM Usuarios WHERE cpf = ? AND senha = ?")) {

                    stmt.setString(1, data.cpf);
                    stmt.setString(2, data.senha);

                    ResultSet rs = stmt.executeQuery();
                    if (rs.next()) {
                        nome = rs.getString("nomeUsuar");
                        cpf = rs.getString("cpf");  
                    }
                }
                if (nome != null) {
                    
                    final String nomeFinal = nome;
                    final String cpfFinal = cpf;
                    writeJson(ex, new Object() {
                        public String status = "OK";
                        public String nomeUsuar = nomeFinal;
                        public String cpfUsuar = cpfFinal;
                       
                    });
                } else {
                    writeJson(ex, new Object() {
                        public String status = "ERRO";
                    });
                }

            } catch (Exception e) { e.printStackTrace(); }
        });


        // ==================================================================
        // BUSCAR GASTO
        // ==================================================================
        server.createContext("/BuscarGasto", ex -> {
            System.out.println("BuscarGasto");
            try {
                if (handleCORS(ex)) return;

                if (!ex.getRequestMethod().equalsIgnoreCase("GET")) {
                    ex.sendResponseHeaders(405, -1);
                    return;
                }

                // ler CPF via querystring
                String query = ex.getRequestURI().getQuery();
                String cpf = null;
                Object dtIni = java.time.LocalDate.now().minusDays(30);
                Object dtFim = java.time.LocalDate.now();


                if (query != null) {
                    for (String part : query.split("&")) {
                        String[] kv = part.split("=");
                        if (kv.length == 2) {

                            if (kv[0].equals("cpf")) {
                                cpf = URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                                System.out.println("cpf: " + cpf);
                            }

                            if (kv[0].equals("dtIni")) {
                                dtIni = URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                                System.out.println("dtIni: " + dtIni);
                            }

                            if (kv[0].equals("dtFim")) {
                                dtFim = URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                                System.out.println("dtFim: " + dtFim);
                            }
                        }
                    }
                }



                if (cpf == null) {
                    writeJson(ex, new Object() { public String erro = "CPF não informado."; });
                    return;
                }
                System.out.println(dtIni + " - " + dtFim);
                var lista = new java.util.ArrayList<Object>();

                try (Connection con = DriverManager.getConnection(url, dbUser, dbPass);
                     PreparedStatement stmt = con.prepareStatement("SELECT * FROM Gastos WHERE cpf = ? and dt_gasto >= ? and dt_gasto <= ?")) {

                    stmt.setString(1, cpf);
                    stmt.setObject(2, dtIni);
                    stmt.setObject(3, dtFim);
                    System.out.printf("SELECT * FROM Gastos WHERE cpf = '%s' AND dt_gasto >= '%s' AND dt_gasto <= '%s'",cpf, dtIni, dtFim);
                    ResultSet rs = stmt.executeQuery();
                    while (rs.next()) {
                        System.out.println(rs.getString("cpf"));
                        int idGasto = rs.getInt("id");
                        String cpfUsuar = rs.getString("cpf");
                        String dtGasto = rs.getString("dt_gasto");
                        String tpGasto = rs.getString("tp_gasto");
                        String vlGasto = rs.getString("vl_gasto");
                        String desGasto = rs.getString("dsc");

                        lista.add(new Object() {
                            public int id = idGasto;
                            public String dt = dtGasto;
                            public String tp = tpGasto;
                            public String vl = vlGasto;
                            public String des = desGasto;
                            public String cpf = cpfUsuar;
                        });
                    }
                }

                writeJson(ex, lista);

            } catch (Exception e) { e.printStackTrace(); }
        });


        // ==================================================================
        // LISTAR CATEGORIAS
        // ==================================================================
        server.createContext("/listarCategorias", ex -> {
            
            try {
                if (handleCORS(ex)) return;
                
                if (!ex.getRequestMethod().equalsIgnoreCase("GET")) {
                    ex.sendResponseHeaders(405, -1);
                    return;
                }

                var lista = new java.util.ArrayList<Object>();

                try (Connection con = DriverManager.getConnection(url, dbUser, dbPass);
                     PreparedStatement stmt = con.prepareStatement("SELECT tp_gasto, descricao FROM TipoGasto");
                     ResultSet rs = stmt.executeQuery()) {

                    while (rs.next()) {
                        int tp = rs.getInt("tp_gasto");
                        String descricao = rs.getString("descricao");

                        lista.add(new Object() {
                            public int tipo = tp;
                            public String descricaoCategoria = descricao;
                        });
                    }
                }

                writeJson(ex, lista);

            } catch (Exception e) { e.printStackTrace(); }
        });


        // ==================================================================
        // REGISTER
        // ==================================================================
        server.createContext("/register", ex -> {
            try {
                if (handleCORS(ex)) return;

                if (!ex.getRequestMethod().equalsIgnoreCase("POST")) {
                    ex.sendResponseHeaders(405, -1);
                    return;
                }

                RegisterDTO data = readJson(ex, RegisterDTO.class);

                try (Connection con = DriverManager.getConnection(url, dbUser, dbPass);
                     PreparedStatement stmt = con.prepareStatement(
                         "INSERT INTO Usuarios (nomeUsuar, cpf, senha, dtCriacao) VALUES (?, ?, ?, ?)")) {

                    stmt.setString(1, data.nome);
                    stmt.setString(2, data.cpf);
                    stmt.setString(3, data.senha);
                    stmt.setObject(4, java.time.LocalDate.now());
                    stmt.executeUpdate();
                }

                writeJson(ex, new Object() { public String status = "OK"; });

            } catch (Exception e) { e.printStackTrace(); }
        });


        // ==================================================================
        // SALVAR GASTO
        // ==================================================================
        server.createContext("/salvarGasto", ex -> {
            try {
                if (handleCORS(ex)) return;

                if (!ex.getRequestMethod().equalsIgnoreCase("POST")) {
                    ex.sendResponseHeaders(405, -1);
                    return;
                }

                GastoDTO data = readJson(ex, GastoDTO.class);

                try (Connection con = DriverManager.getConnection(url, dbUser, dbPass);
                     PreparedStatement stmt = con.prepareStatement(
                         "INSERT INTO Gastos (Cpf, dsc, vl_gasto, dt_gasto, dt_impl, tp_gasto) VALUES (?, ?, ?, ?, ?, ?)")) {

                    System.out.println("Criar Gastos: CPF: " + data.cpfUsuar + " Dsc: " + data.des + " vl: " + data.vl + " data: " + data.dt + " Tipo: " + data.tp);
                    stmt.setString(1, data.cpfUsuar);
                    stmt.setString(2, data.des);
                    stmt.setBigDecimal(3, new java.math.BigDecimal(data.vl));
                    stmt.setString(4, data.dt);
                    stmt.setObject(5, java.time.LocalDate.now());
                    stmt.setInt(6, data.tp);
                    stmt.executeUpdate();
                }

                writeJson(ex, new Object() { public String status = "OK"; });

            } catch (Exception e) { e.printStackTrace(); }
        });


        // ==================================================================
        // EDITAR GASTO
        // ==================================================================
        server.createContext("/EditarGasto", ex -> {
            try {
                System.out.println("EditarGasto");
                if (handleCORS(ex)) return;

                if (!ex.getRequestMethod().equalsIgnoreCase("POST")) {
                    ex.sendResponseHeaders(405, -1);
                    return;
                }

                EditarGastoDTO data = readJson(ex, EditarGastoDTO.class);

                try (Connection con = DriverManager.getConnection(url, dbUser, dbPass);
                     PreparedStatement stmt = con.prepareStatement(
                         "UPDATE Gastos SET vl_gasto = ?, dt_gasto = ?, tp_gasto = ?, dsc = ? WHERE cpf = ? AND id = ?")) {
                    stmt.setBigDecimal(1, new java.math.BigDecimal(data.vl));
                    stmt.setString(2, data.dt);
                    stmt.setInt(3, data.tp);
                    stmt.setString(4,data.des);
                    stmt.setString(5,data.cpfUsuar);
                    stmt.setInt(6, data.id);
                    stmt.executeUpdate();

                    System.out.println(data.dt + data.tp + data.cpfUsuar + data.id);
                }
                
                writeJson(ex, new Object() { public String status = "OK"; });

            } 
            
            catch (Exception e) {e.printStackTrace(); }
        });

        /* Delete Gasto */
        server.createContext("/RemoverGasto", ex -> {
            try {
                System.out.println("RemoverGasto");
                if (handleCORS(ex)) return;

                if (!ex.getRequestMethod().equalsIgnoreCase("POST")) {
                    ex.sendResponseHeaders(405, -1);
                    return;
                }
            

                RemoverGastoDTO data = readJson(ex, RemoverGastoDTO.class);
            
                try (Connection con = DriverManager.getConnection(url, dbUser, dbPass);
                        PreparedStatement stmt = con.prepareStatement(
                            "Delete from Gastos where gastos.id = ? and gastos.cpf = ?")) {
                        stmt.setString(2,data.cpfUsuar);
                        stmt.setInt(1, data.id);
                        stmt.executeUpdate();

                        System.out.println("Removendo Gasto: " + data.cpfUsuar +"/" +  data.id);
                    }
                    
                    writeJson(ex, new Object() { public String status = "OK"; });

                } 
            
                catch (Exception e) {e.printStackTrace();
            
            }

            });
        server.start();
        System.out.println("Servidor rodando em http://localhost:8080");
    }
}
