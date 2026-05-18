/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React, { useState, useEffect } from "react";
import { QAPageLayout } from "../components/qa/templates/QAPageLayout";
import { TabNav, QATabId } from "../components/qa/molecules/TabNav";
import { SearchBar } from "../components/qa/molecules/SearchBar";
import { cx } from "@/components/theme/utils";
import { Typography, Button } from "@/components/theme";
import { QuestionList } from "../components/qa/organisms/QuestionList";
import { NotificationList } from "../components/qa/organisms/NotificationList";
import { LiveList } from "../components/qa/organisms/LiveList";
import { PaymentView } from "../components/qa/organisms/PaymentView";
import { Switch } from "../components/qa/atoms/Switch";
import { History } from "lucide-react";
import { type SideTabId } from "../components/qa/organisms/SideNav";
import { AskQuestionView } from "./AskQuestionView";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * MyQuestionsPage View
 * The main container for the Q&A section.
 */
export const MyQuestionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<QATabId>("my-questions");
  const [liveTab, setLiveTab] = useState<"my-live" | "community-live">("my-live");
  const [sideTab, setSideTab] = useState<SideTabId>("my-questions");
  const [isOnline, setIsOnline] = useState(true);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  
  // Reset scroll when switching sub-tabs (Bookmark, Notification, etc)
  useEffect(() => {
    const container = document.querySelector('main.overflow-y-auto');
    if (container) {
      container.scrollTop = 0;
    }
  }, [sideTab, activeTab, isAskingQuestion]);

  const isBookmark = sideTab === "bookmark";
  const isNotification = sideTab === "notification";
  const isLive = sideTab === "live";
  const isPayment = sideTab === "payment";
  const isCommunity = sideTab === "community";
  const isNetwork = sideTab === "network";

  const [networkTab, setNetworkTab] = useState<"my" | "community" | "schools">("my");

  if (isAskingQuestion) {
    return (
      <QAPageLayout activeSideTab={sideTab} onSideTabChange={setSideTab}>
        <AskQuestionView 
          onBack={() => setIsAskingQuestion(false)} 
          onNext={(data) => {
            console.log("Next clicked with data:", data);
            setIsAskingQuestion(false);
          }} 
        />
      </QAPageLayout>
    );
  }

  return (
    <QAPageLayout activeSideTab={sideTab} onSideTabChange={setSideTab}>
      <div className="sticky top-0 z-40 bg-white -mx-8 px-8">
        {isPayment ? (
          <div className="flex items-center justify-between border-b border-border-subtle w-full px-1">
            <div className="relative py-4 text-[15px] font-black text-primary-900 uppercase tracking-tight">
              Payment Management
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full" />
            </div>
            <button className="flex items-center gap-2 text-text-tertiary hover:text-primary-600 transition-colors">
              <span className="text-[13px] font-bold uppercase tracking-widest">History</span>
              <History size={18} />
            </button>
          </div>
        ) : isLive ? (
          <div className="flex items-center justify-between border-b border-border-subtle w-full px-1">
            <div className="flex items-center gap-12">
              <button 
                onClick={() => setLiveTab("my-live")}
                className={cx(
                  "relative py-4 text-[15px] font-black uppercase tracking-tight transition-all",
                  liveTab === "my-live" ? "text-primary-900" : "text-text-tertiary"
                )}
              >
                My Live
                {liveTab === "my-live" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full" />}
              </button>
              <button 
                onClick={() => setLiveTab("community-live")}
                className={cx(
                  "relative py-4 text-[15px] font-black uppercase tracking-tight transition-all",
                  liveTab === "community-live" ? "text-primary-900" : "text-text-tertiary"
                )}
              >
                Community Live
                {liveTab === "community-live" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full" />}
              </button>
            </div>
            <Button 
              onClick={() => setIsAskingQuestion(true)}
              className="h-10 px-6 rounded-lg !bg-primary-900 !text-white border-none font-bold text-sm shadow-md transition-all active:scale-95"
            >
              Create Question
            </Button>
          </div>
        ) : (isBookmark || isNotification) ? (
          <div className="flex items-center border-b border-border-subtle w-full px-1">
            <button className="relative py-4 text-[15px] font-black text-primary-900 uppercase tracking-tight">
              {isBookmark ? "Bookmark" : "Notification"}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full" />
            </button>
          </div>
        ) : isCommunity ? (
          <div className="relative flex items-center justify-between w-full px-1 border-b border-border-subtle">
            <div className="relative py-4 text-[15px] font-black text-primary-900 uppercase tracking-tight">
              Community Wiki
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full" />
            </div>
            <Button 
              onClick={() => setIsAskingQuestion(true)}
              className="h-10 px-6 rounded-xl !bg-primary-900 !text-white border-none font-bold text-[13px] shadow-lg shadow-primary-900/10 transition-all"
            >
              Ask Question
            </Button>
          </div>
        ) : isNetwork ? (
          <div className="flex items-center justify-between border-b border-border-subtle w-full px-1">
            <div className="flex items-center gap-12">
              <button 
                onClick={() => setNetworkTab("my")}
                className={cx(
                  "relative py-4 text-[15px] font-black uppercase tracking-tight transition-all",
                  networkTab === "my" ? "text-primary-900" : "text-text-tertiary"
                )}
              >
                My Questions
                {networkTab === "my" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full" />}
              </button>
              <button 
                onClick={() => setNetworkTab("community")}
                className={cx(
                  "relative py-4 text-[15px] font-black uppercase tracking-tight transition-all",
                  networkTab === "community" ? "text-primary-900" : "text-text-tertiary"
                )}
              >
                Community Questions
                {networkTab === "community" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full" />}
              </button>
              <button 
                onClick={() => setNetworkTab("schools")}
                className={cx(
                  "relative py-4 text-[15px] font-black uppercase tracking-tight transition-all",
                  networkTab === "schools" ? "text-primary-900" : "text-text-tertiary"
                )}
              >
                Schools
                {networkTab === "schools" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full" />}
              </button>
            </div>
            <Button 
              onClick={() => setIsAskingQuestion(true)}
              className="h-10 px-6 rounded-xl !bg-primary-900 !text-white border-none font-bold text-[13px] shadow-lg shadow-primary-900/10 transition-all"
            >
              Ask Question
            </Button>
          </div>
        ) : (
          <TabNav 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onAskQuestion={() => setIsAskingQuestion(true)} 
          />
        )}
      </div>

      {isPayment ? (
        <PaymentView />
      ) : isLive ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 py-6">
            <Switch checked={isOnline} onChange={setIsOnline} />
            <Typography className="text-[14px] font-black text-text-primary uppercase tracking-tighter">
              Available online
            </Typography>
          </div>
          <LiveList />
        </div>
      ) : isNotification ? (
        <NotificationList />
      ) : (
        <>
          <SearchBar />
          <QuestionList 
            defaultExpandedAll={activeTab === "my-answers" && !isBookmark} 
            isBookmarkedView={isBookmark}
          />
        </>
      )}
    </QAPageLayout>
  );
};

/** ################################ /COMPONENT ############################# */
