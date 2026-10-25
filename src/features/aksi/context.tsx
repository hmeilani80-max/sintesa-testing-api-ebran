                }
              : item,
          ),
        );

        audit(`Order ${id} dikirim ke ${order.channels.length} kanal`);

        return true;
      },

      setChannel: (id, channel, status, url) => {
        setOrders((current) =>
          current.map((order) => {
            if (order.id !== id) return order;

            const channels = order.channels.map((item) =>
              item.channel === channel
                ? { ...item, status, url: url ?? item.url }
                : item,
            );

            const done = channels.every(
              (item) =>
                item.status === "Selesai" || item.status === "Ditolak",
            );

            return {
              ...order,
              channels,
              status: done ? "Selesai" : order.status,
            };
          }),
        );

        audit(`Order ${id} · ${channel}: ${status}`);
      },

      setAccountConnection: (id, status) => {
        setAccounts((current) =>
          current.map((account) =>
            account.id === id
              ? { ...account, status, updatedAt: "Baru saja" }
              : account,
          ),
        );

        audit(
          `Akun ${id}: status koneksi diubah menjadi ${
            status === "Ready"
              ? "Terhubung"
              : status === "Busy"
                ? "Perlu Autentikasi Ulang"
                : "Terputus"
          }`,
        );
      },

      setAccountGroup: (id, group) =>
        setAccounts((current) =>
          current.map((account) =>
            account.id === id
              ? { ...account, group, updatedAt: "Baru saja" }
              : account,
          ),
        ),

      setAccountLabel: (id, label) =>
        setAccounts((current) =>
          current.map((account) =>
            account.id === id
              ? { ...account, label, updatedAt: "Baru saja" }
              : account,
          ),
        ),

      setAccountRoles: (id, roles) =>
        setAccounts((current) =>
          current.map((account) =>
            account.id === id
              ? { ...account, roles, updatedAt: "Baru saja" }
              : account,
          ),
        ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productions,
    campaigns,
    orders,
    log,
    accounts,
    databaseLoadStatus,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAksi() {
  const context = useContext(Ctx);

  if (!context) {
    throw new Error("useAksi must be used within AksiProvider");
  }

  return context;
}

/** Each Produksi item is itself one output; kept as {production, output} for distribution pages. */
export function findOutput(
  productions: ProductionItem[],
  outputId: string,
) {
  const production = productions.find((item) => item.id === outputId);

  return production
    ? { production, output: production }
    : undefined;
}
