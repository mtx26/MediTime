import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toISO } from '@meditime/utils';
import { useAlert } from "@/contexts/AlertContext";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link2, Trash2, Plus, Clipboard } from 'lucide-react';
import type { TokenListProps, SharedCalendarToken } from '@meditime/types';

const VITE_URL = import.meta.env.VITE_VITE_URL ?? '';

export default function TokenList({ data, calendarId, tokenCalendars, onRefresh }: TokenListProps) {
  const { t } = useTranslation();
  const { lng } = useParams();
  const { showAlert, showConfirm } = useAlert();

  const today = toISO(new Date());
  const expiresAt: string | null = null;
  const permissions = "read";

  const handleCopyLink = async (token: SharedCalendarToken) => {
    try {
      await navigator.clipboard.writeText(
        `${VITE_URL}/${lng}/shared-token-calendar/${token.id}`,
      );
      showAlert('success', t("link_copied"));
    } catch {
      showAlert('danger', t("copy_link_error"));
    }
  };

  const handleUpdateTokenExpiration = async (tokenId: string, date: string | null) => {
    await tokenCalendars.updateTokenExpiration(tokenId, date);
  };

  const deleteTokenConfirmAction = (tokenId: string) => {
    showConfirm(
      'confirm-danger',
      t("delete_link_title"),
      t("delete_link_description"),
      async () => {
        const rep = await tokenCalendars.deleteToken(tokenId);
        if (rep.success) {
          onRefresh();
        }
      }
    );
  };

  const handleCreateToken = async () => {
    const rep = await tokenCalendars.createToken(calendarId, expiresAt, permissions);
    if (rep.success) {
      onRefresh();
    }
  };

  return (
    data.tokens.length !== 0 ? (
      (data.tokens || []).map((token: SharedCalendarToken) => (
        <Card key={token.id} className="shadow">
          <CardContent>
            <h5 className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                {t("public_links")} :
              </div>
            </h5>
            <div>
              {/* Lien */}
              <div className="flex mt-1 mb-2" data-tour="share-public-links">
                <Input
                  id={"tokenLink" + token.id}
                  type="text"
                  className={`flex-1 min-w-0 rounded-r-none border-2 text-sm ${
                    token.expires_at && new Date(token.expires_at) < new Date()
                      ? "border-destructive"
                      : "border-green-500"
                  }`}
                  aria-label={t("shared_link_label")}
                  title={t("shared_link_label")}
                  value={`${VITE_URL}/${lng}/shared-token-calendar/${token.id}`}
                  readOnly
                />
                <Button
                  variant={token.expires_at && new Date(token.expires_at) < new Date() ? "destructive" : "outline"}
                  className={`rounded-l-none shrink-0 ${!(token.expires_at && new Date(token.expires_at) < new Date()) && "border-green-500 text-green-600 hover:bg-green-50"}`}
                  onClick={() => handleCopyLink(token)}
                  aria-label={t("copy_link")}
                  title={t("copy_link")}
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  className="ml-2"
                  onClick={() => deleteTokenConfirmAction(token.id)}
                  aria-label={t("delete")}
                  title={t("delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Expiration */}
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={`tokenExpiration${token.id}`}
                  className="font-semibold whitespace-nowrap"
                >
                  {t("expiration")}:
                </label>
                <Select
                  value={token.expires_at === null ? "never" : "date"}
                  onValueChange={(value) => {
                    handleUpdateTokenExpiration(
                      token.id,
                      value === "never" ? null : today,
                    );
                  }}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">{t("never")}</SelectItem>
                    <SelectItem value="date">{t("date")}</SelectItem>
                  </SelectContent>
                </Select>
                {token.expires_at && (
                  <Input
                    type="date"
                    className="w-full sm:w-auto min-w-32"
                    value={toISO(token.expires_at)}
                    onChange={(e) =>
                      handleUpdateTokenExpiration(
                        token.id,
                        toISO(e.target.value),
                      )
                    }
                    min={toISO(today)}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))
    ) : (
      <Card className="shadow">
        <CardContent>
          <h5 className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {t("public_links")} :
          </h5>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleCreateToken()}
            aria-label={t("create_share_link")}
            title={t("create_share_link")}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("create_share_link")}
          </Button>
        </CardContent>
      </Card>
    )
  );
}
